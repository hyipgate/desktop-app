/* Require libraries */
const { remote, ipcRenderer } = require('electron')


//************************************************************************//
//                       EXTERNAL FUNCTIONS                               //
//************************************************************************//
var film_loaded = false;

function load_film(scenes, src, ref) {
    console.log("loading film: ", scenes, src, ref)

    reference.tableList = []
    reference.tables = {}
    reference.our_src = ""
    reference.original_size = 0
    sync.offset = {}
    sync.confidence = {}
    sync.histogram = {}
    sync.last_correct_sync = {}
    sync.last_was_weird = {}

    reference.load(src, ref)

    skip.load_list(scenes);

    timer_id = setInterval(check_everything_works, 80);
    wc.loaded = false
    film_loaded = true;
}

var s_start = false;

/**
 * Stop watching
 */
function end_capture() {
    //print_stats()
    if (timer_id) clearInterval(timer_id);
    if (wc.webview) wc.send("unload")
    ipcRenderer.send('exit-fullscreen')
    wc.webview = false
    wc.rect = false

    if (!reference.tables) return

    // Check if we got new frames added to the table
    if (reference.original_size >= Object.keys(reference.tables[reference.our_src]).length) {
        console.log("Nothing new here")
        return false
    }
    return reference.tables[reference.our_src]
}

var isDialogVisible = false

function check_everything_works() {
    // if the dialog is visible, we don't really want to skip nor to capture frames (dialog is in the middle)
    if (isDialogVisible) return

    // If we don't have a video frame, what are we gonna capture?
    if (!wc.rect) return console.log("[check_everything_works] Missing wc.rect"); //todo add get rect/load webview

    // check if we want to see this frame, and skip if necesary
    skip.want_to_see()

    // If a new hash is needed as future reference or to sync, capture it
    var time = video_time()
    if (reference.need_hash(time) || sync.need_hash(time)) {
        console.log("[check_everything_works] get-hash")
        ipcRenderer.send('get-hash', { time: time, rect: wc.rect })
    }
}


/**
 * Mark current time as the start/end of a scene
 */
function mark_current_time() {
    if (!s_start) {
        s_start = reference.nearest_scene_change(video_time(), true)
        wc.send('mute', true)
        console.log("Scene start marked at ", s_start)
    } else {
        var s_end = reference.nearest_scene_change(video_time(), false)
        var scene = { start: s_start, end: s_end, tags: [], comment: "" }
        wc.send('pause', true)
        wc.send('mute', false)
        console.log("Scene added ", s_start, " -> ", s_end)
        s_start = null;
        return scene;
    }
}



/* Define some global variables */
var time = 0;
var timer_id = false;
var cpu_time = 0;







/**
 * Gets the time the current video is at
 */
function video_time() {
    // Check we have some time data
    if (time == 0 || cpu_time == 0) return 0;
    // Elapsed time since variable "time" was updated.
    var elapsed_time = (Date.now() - cpu_time);
    // Detect if video is paused (time gets updated at least every 250ms) TODO: Improve this hack
    if (elapsed_time > 500) elapsed_time = 0;
    // Return video time
    return Math.floor(time + elapsed_time)
}



//************************************************************************//
//                         CORE FUNCTIONS                                 //
//************************************************************************//


// Webview functions
var wc = {
    loaded: false,
    orect: false,
    rect: false,
    webview: false,

    // load the webview
    load: function() {
        /* Check there is a "webview" tag and that it is not already loaded */
        if (wc.loaded) return console.log("webview already loaded! ")
        wc.webview = document.getElementsByTagName('webview')[0]
        if (!wc.webview) return console.log("webview not ready yet ")

        /* Listen events from main thread */
        ipcRenderer.on('hash-ready', (event, arg) => {
            var processing_time = video_time() - arg.time
            if (processing_time < 0 || processing_time > 50) {
                console.log("[hash-ready] (ERROR) Discarding frame, processing_time:  ", Math.floor(processing_time))
                return;
            }
            // Add hash to list
            reference.add_hash(arg.hash, arg.time + processing_time / 2)
            // Update sync
            for (var i = 0; i < reference.tableList.length; i++) {
                sync.update(arg.hash, arg.time + processing_time / 2, reference.tableList[i])
            }

        })

        ipcRenderer.on('improved-rect-ready', (event, arg) => {
            // Check this is the improved version of the LAST rect (race conditions may happen)
            if (wc.orect.x != arg.orect.x) return console.log("[improved-rect-ready] (ERROR) ask to improve ", wc.rect, " got improved ", arg.rect)
            // Update rect
            wc.rect = arg.rect
            console.log('[improved-rect-ready] got ', arg.rect)
        })

        /* Listen to events from player */
        wc.webview.addEventListener('ipc-message', event => {
            if (event.channel == "video_rect") {
                var r = event.args[0];
                if (r.width == 0 || r.height == 0) return;
                wc.orect = r;
                wc.rect = r;
                ipcRenderer.send('improve-rect', { orect: wc.orect })
            } else if (event.channel == "currentTime") {
                time = 1000 * event.args[0];
                cpu_time = Date.now();
            } else if (event.channel == "skip_finished") {
                skip.is_previewing = false
            } else {
                console.log("ipc-message received: ", event.channel)
            }
        })

        wc.webview.addEventListener('did-navigate', (e) => {
            reference.set_our_src(e.url)
        })

        wc.loaded = true

        return true;
    },

    // send a command to the webview
    send: function(action, params) {
        if (!wc.webview) {
            wc.load()
            return console.log("(ERROR) Trying to '", action, "' but we don't have a webview!");
        }
        console.log("[wc.send] Doing '", action, "' with ", params)
        wc.webview.send(action, params)
    }
}







/*
    Skip bits
*/
var skip = {

    list: [], // list of scenes to skip
    next_start: Infinity, // where the next bit to skip starts
    is_previewing: false,

    load_list: function(scenes) {
        skip.list = []
        for (var i = 0; i < scenes.length; i++) {
            if (!scenes[i].skip) continue // scenes contains all scenes, not only those we want to skip
            reference.pushSrc(scenes[i].src) // push source into the list of sources we want to track the sync to
            skip.list.push({ // push the scene into the list of scenes to skip
                start: scenes[i].start,
                end: scenes[i].end,
                src: scenes[i].src
            })
        }
    },

    // load the preview of a scene
    preview: function(start, end, src) {
        console.log("Starting preview of: ", start, "->", end, " @ ", src)
        reference.pushSrc(src) // push source into list or sources to keep sync with

        // remove old preview scenes
        for (var i = skip.list.length - 1; i >= 0; i--) {
            if (skip.list[i].preview) {
                skip.list.splice(i, 1);
            }
        }
        // add new scene to the list
        skip.list.push({ start: start, end: end, preview: true, src: src });
        // jump a bit before the start of the scene
        var u_start = sync.to_users_time(start, src)
        wc.send('seek-time', u_start - 2500)
        wc.send('pause', false)
        skip.is_previewing = true
    },

    want_to_see: function() {
        reference.tableList = []
        // Find next scene
        var overlaping_th = 500 // Consider two scenes overlap is gap between them is smaller than this value
        var c_time = video_time()
        var next_start = Infinity
        var next_end = Infinity
        for (var i = 0; i < skip.list.length; i++) {
            var time_to_end = skip.list[i].end - sync.to_reference_time(c_time, skip.list[i].src, "end")
            var time_to_start = skip.list[i].start - sync.to_reference_time(c_time, skip.list[i].src, "start")
            if (time_to_end < 0) continue // Ignore scenes that are in the past
            reference.pushSrc(skip.list[i].src) // Make sure this src is updated
            if (time_to_start > next_end + overlaping_th) continue // Out of the future scenes, ignore all but the next one
            if (next_start > time_to_end + overlaping_th) { // We are before in time, replace
                next_end = time_to_end
                next_start = time_to_start
            } else { // There is overlaping between scenes!
                next_start = Math.min(next_start, time_to_start)
                next_end = Math.max(next_end, time_to_end)
            }
        }
        // If scene is close, tell the webview to skip that times
        if (next_start < 200) {
            console.log("Scene almost here, wait ", next_start, "ms and skip: ")
            wc.send('skip-scene', { start: next_start + c_time, end: next_end + c_time })
        }
        // Keep this for health reports
        skip.next_start = next_start + c_time
    }
}



var debug = {
    induced_sync_offset: 0, // Induce a fake sync offset (to see if system recovers). Keep this at 0!
    startScreenshoting: false,
    // stats
    false_positive: 0,
    false_negative: 0,
    total: 0,
    error: 0,
    real_error: 0,
    abs_error: 0,

    // Print error stats (when collected :)
    print_stats: function() {
        console.log(debug.false_negative, debug.false_positive, debug.total, debug.error, debug.real_error)
    },

    // Draw a rectangle around the rect (to check it has been detected properly)
    draw: function(v) {
        wc.send('draw-rect', { rect: wc.rect, visibility: v })
    },

    // Print timings on console
    cb: function(what) {
        if (what == "start") {
            debug.startScreenshoting = Date.now()
        } else {
            console.log(what, ": ", Date.now() - debug.startScreenshoting)
        }
    }

}

var sync = {

    histogram: {},
    confidence: {}, // Stimated probability [0,1] of current sync offset being right
    last_correct_sync: {},
    last_was_weird: {},
    offset: {}, // Best know time offset

    min_probability: 0.01,
    span: 20, // Search area radio



    need_hash: function() {
        var time = video_time()
        //if (skip.next_start - time * 0.75 >= 10 * 60 * 1000) return false
        for (var i = 0; i < reference.tableList.length; i++) {
            var src = reference.tableList[i]
            if (sync.confidence[src] < 0.8) return true
            if (Math.abs(time - sync.last_correct_sync[src]) > 500) return true
            if (sync.last_was_weird[src]) return true
        }
    },

    // Locates the specified time in the reference film.
    to_reference_time: function(c_time, src, extreme = "center") {
        if (reference.our_src == src) {
            console.log("[to_users_time] ", c_time, src, extreme, "same")
            return c_time
        }
        console.log("[to_users_time] ", c_time, src, extreme, "offset is", sync.offset[src][extreme])
        return c_time + sync.offset[src][extreme] // r - c = o
    },

    // Locates the specified time in the users film.
    to_users_time: function(r_time, src, extreme = "center") {
        if (reference.our_src == src) {
            //console.log("[to_users_time] ", r_time, src, extreme, "same")
            return r_time
        }
        //console.log("[to_users_time] ", r_time, src, extreme, "offset is", sync.offset[src][extreme])
        return r_time - sync.offset[src][extreme] // r - c = o
    },

    normalize: function(vector) {
        var sum = 0
        for (var offset in vector) sum += vector[offset]
        for (var offset in vector) vector[offset] = vector[offset] / sum
        return vector
    },

    update: function(c_hash, c_time, src) {
        // Check we have the data we need
        console.log("[sync.update] ", c_hash, c_time, src)
        if (!c_hash || !c_time || !src) return console.log("[sync.update] Missing c_time || c_hash || src");

        c_time += 1000 * debug.induced_sync_offset // DEBUG

        // Prepare data
        var histogram = sync.histogram[src] || {}
        var guessed_time = sync.to_reference_time(c_time, src);
        var guessed_block = Math.floor(guessed_time / 1000);

        // Compare user's frame with reference's frames in "span" blocks around the "guessed_time"
        var d_arr = {};
        var d_min = Infinity;
        var d_max = -Infinity
        for (var block = guessed_block - sync.span; block <= guessed_block + sync.span; block++) {
            var ref_data = reference.tables[src][block] || []
            for (var r = 0; r < ref_data.length; r++) {
                var d = sync.hamming_distance(ref_data[r][0], c_hash)
                var offset = "" + Math.round((ref_data[r][1] + block * 1000 - c_time) / 80)
                if (d < d_min) d_min = d;
                if (d > d_max) d_max = d;
                d_arr[offset] = d;
            }
        }

        // When a hash at "offset" is missing, we don't have a "d_arr[offset]", set it to the last value
        var last = d_max
        for (var offset in histogram) {
            if (!d_arr[offset]) {
                d_arr[offset] = last
            } else {
                last = d_arr[offset]
            }
        }

        // Calculate new evidence, ie. p(z|x) = p(current d_arr | offset ) = evidence[offset]
        var evidence = {}
        var e_max = -Infinity
        var e_min = Infinity
        for (var offset in d_arr) {
            var e = (d_min + 8) / (d_arr[offset] + 2)
            evidence[offset] = e
            if (e > e_max) e_max = e
            if (e < e_min) e_min = e
        }
        //evidence = sync.normalize(evidence)

        //console.log(histogram, evidence)

        // Update histogram with evidence
        var min_prob = sync.min_probability / sync.span / 12 / 2
        for (var offset in evidence) {
            var previous = histogram[offset] ? Math.max(min_prob, histogram[offset]) : min_prob
            histogram[offset] = previous * evidence[offset]
        }

        // Normalize histogram
        histogram = sync.normalize(histogram)


        // Find item with maximum probability
        var max = -Infinity;
        var m_offset = "0"
        var sofar = 0
        var q1, q3
        for (var offset in histogram) {
            if (histogram[offset] > max) {
                max = histogram[offset]
                m_offset = offset
            }
            sofar += histogram[offset]
            //if (!q1 && sofar > 0.05) q1 = offset // for in loops don't go in order
            //if (!q3 && sofar > 0.95) q3 = offset
        }

        c_time -= 1000 * debug.induced_sync_offset // DEBUG
        // Update values with new sync
        sync.histogram[src] = histogram
        sync.confidence[src] = max
        if (sync.confidence[src] > 0.8) {
            sync.last_correct_sync[src] = c_time; // detect possible error (eg flat probability)
            sync.offset[src].center = parseInt(m_offset) * 80
            sync.offset[src].start = parseInt(m_offset) * 80 - 160
            sync.offset[src].end = parseInt(m_offset) * 80 + 160
        }
        sync.last_was_weird[src] = (d_arr[m_offset] - d_min > 5) // check if current minimum match historic minimum

        console.log("[update_sync] Now is ", Math.floor(c_time / 1000), "s we are using ", sync.offset[src].center / 1000, "s offset. Last sync gave ", parseInt(m_offset) * 80 / 1000, "s offset with ", Math.round(100 * max), "%, d_min:", d_min, ", d_max:", d_max, ", e_max:", e_max, ", e_min:", e_min)

    },

    // Calculate the hamming distance between two base64 encoded strings
    hamming_distance: function(a, b) {
        var digitsMap = { "0": "000000", "1": "000001", "2": "000010", "3": "000011", "4": "000100", "5": "000101", "6": "000110", "7": "000111", "8": "001000", "9": "001001", "A": "001010", "B": "001011", "C": "001100", "D": "001101", "E": "001110", "F": "001111", "G": "010000", "H": "010001", "I": "010010", "J": "010011", "K": "010100", "L": "010101", "M": "010110", "N": "010111", "O": "011000", "P": "011001", "Q": "011010", "R": "011011", "S": "011100", "T": "011101", "U": "011110", "V": "011111", "W": "100000", "X": "100001", "Y": "100010", "Z": "100011", "a": "100100", "b": "100101", "c": "100110", "d": "100111", "e": "101000", "f": "101001", "g": "101010", "h": "101011", "i": "101100", "j": "101101", "k": "101110", "l": "101111", "m": "110000", "n": "110001", "o": "110010", "p": "110011", "q": "110100", "r": "110101", "s": "110110", "t": "110111", "u": "111000", "v": "111001", "w": "111010", "x": "111011", "y": "111100", "z": "111101", "+": "111110", "-": "111111" }
        var distance = 0;
        for (var i = 0; i < a.length - 1; i++) {
            if (a.charAt(i) == b.charAt(i)) continue;
            var ai = digitsMap[a.charAt(i)]
            var bi = digitsMap[b.charAt(i)]
            for (var j = 0; j < 6; j++) {
                distance += (ai.charAt(j) == bi.charAt(j))
            };
        };
        return distance;
    },

    health_report: function(src) {
        if (src && src === reference.our_src) return 0

        if (!film_loaded) return

        if (!wc.webview && !wc.load()) return 1e6

        var time = video_time()
        if (!wc.rect || Math.abs(time - sync.last_rect) > 60 * 1000) {
            wc.send('get-rect') // fixme, this true might force update too often
            sync.last_rect = time
        }

        if (skip.next_start - time > Infinity) return 0

        var last = Infinity
        var tableList = src ? [src] : reference.tableList
        for (var i = 0; i < tableList.length; i++) {
            var src = tableList[i]
            last = Math.min(sync.last_correct_sync[src], last)
        }
        return Math.floor(time - last)
    },

    last_rect: 0
}






var reference = {
    load: function(our_src, tables) {
        console.log(our_src, tables)
        for (var src in tables) {
            if (!tables[src].src) continue
            reference.addTableEntry(src, tables[src])
        }
        reference.set_our_src(our_src)
    },

    addTableEntry: function(src, data) {
        reference.tables[src] = data
        sync.offset[src] = { start: 0, center: 0, end: 0 }
        sync.confidence[src] = 0
        sync.histogram[src] = {}
        sync.last_correct_sync[src] = -Infinity
        sync.last_was_weird[src] = false
    },

    set_our_src: function(our_src) {
        console.log("got new src ", our_src)
        // TODO store the hash of the src, intead of the full src
        reference.our_src = our_src
        if (!reference.tables[our_src]) {
            reference.tables[our_src] = { src: our_src }
            sync.offset[our_src] = { start: 0, center: 0, end: 0 }
            sync.confidence[our_src] = 0
            sync.histogram[our_src] = {}
            sync.last_correct_sync[our_src] = -Infinity
            sync.last_was_weird[our_src] = false
        }
        reference.original_size = Object.keys(reference.tables[our_src]).length;
    },

    pushSrc: function(src) {
        if (!sync.offset[src]) {
            reference.addTableEntry(src, { src: src })
            console.log("[pushSrc] (ERROR) adding table now?!")
        }
        if (reference.tableList.indexOf(src) != -1) return
        if (reference.our_src == src) return
        reference.tableList.push(src)
    },

    //add a hash-time pair to the ref list
    add_hash: function(c_hash, c_time) {
        if (!reference.need_hash(c_time)) return

        var block = Math.floor(c_time / 1000)
        var ms = c_time - 1000 * block
        var table = reference.tables[reference.our_src]
        if (!table[block]) table[block] = []
        table[block].push([c_hash, ms])
        console.log("[add_hash] ", c_hash, block, ms)
    },

    need_hash: function(c_time) {
        var block = Math.floor(c_time / 1000)
        var ms = c_time - 1000 * block

        var ref_data = reference.tables[reference.our_src][block] || []
        for (var i = 0; i < ref_data.length; i++) {
            if (Math.abs(ref_data[i][1] - ms) < 50) return false
        }
        return true
    },

    nearest_scene_change: function(t_pressed, start) {
        var max_distance = 0;
        var change_at = -1;
        var span = start ? 2000 : 1000
        var previous_hash = false
        for (var block = Math.floor((t_pressed - span) / 1000); block <= Math.floor(t_pressed / 1000); block++) {
            var ref_data = reference.tables[reference.our_src][block]
            if (!ref_data) ref_data = []
            for (var i = 1; i < ref_data.length; i++) {
                var t = ref_data[i][1] + block * 1000
                if (t < t_pressed - span || t > t_pressed) continue;
                if (previous_hash) {
                    var d = sync.hamming_distance(ref_data[i][0], previous_hash);
                    /*var dev = ((t_pressed - t) - span / 2) / 750
                    console.log(t, " -> ", d, " -> ", d - dev * dev)
                    d = d - dev * dev*/
                    if (start && d > max_distance) {
                        max_distance = d
                        change_at = t - 120
                    } else if (!start && d >= max_distance) {
                        max_distance = d
                        change_at = t + 120
                    }
                }
                previous_hash = ref_data[i][0]
            };
        };
        console.log("Pressed at: ", t_pressed, " scene change at: ", change_at)
        if (change_at == -1) change_at = t_pressed - span
        return change_at;
    },

    get_url_hash: function(str) {
        var hash = 0;
        if (str.length == 0) return hash;
        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash + "";
    }
}




//************************************************************************//
//             DEPRECATED/DEBBUGING FUNCTIONS                             //
//************************************************************************//

function seek_time(time) {
    wc.send('seek-time', time)
}

function skip_scene(start, end) {
    wc.send('skip-scene', { start: start, end: end })
}

function go_to_frame(time) {
    wc.send('go-to-frame', time)
}

function pause(state) {
    wc.send('pause', !!state)
}