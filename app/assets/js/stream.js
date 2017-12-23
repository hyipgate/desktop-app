/* Require libraries */
const { remote, ipcRenderer } = require('electron')


//************************************************************************//
//                       EXTERNAL FUNCTIONS                               //
//************************************************************************//
var film_loaded = false;

function load_film(scenes, file, ref) {
    console.log("loading film: ", scenes, file, ref)

    reference.load(file, ref)

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

    var new_ref = reference.table
    if (reference.original_size == Object.keys(new_ref).length) {
        console.log("Nothing new here")
        return false
    }
    return new_ref
}


function check_everything_works() {

    if (!wc.rect) return console.log("[check_everything_works] Missing wc.rect"); //todo add get rect/load webview

    var time = video_time()
    skip.want_to_see()
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
        var scene = { start: s_start / 1000, end: s_end / 1000, tags: [], comment: "" }
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
 * Gets the timestamps of the current video
 * @returns {number} current time
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


var wc = {
    loaded: false,
    orect: false,
    rect: false,
    webview: false,

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
            // Add hash to list and skip frames (when needed)
            reference.add_hash(arg.hash, arg.time + processing_time / 2)
            sync.update(arg.hash, arg.time + processing_time / 2)
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
            } else {
                console.log("ipc-message received: ", event.channel)
            }
        })

        wc.loaded = true

        return true;
    },

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

    list: [],
    next_start: Infinity,

    load_list: function(raw_scenes) { // TODO: check this actually merge ovelaping scenes. Remove duplicates...

        var scenes = []
        for (var i = 0; i < raw_scenes.length; i++) {
            if (raw_scenes[i].skip) scenes.push(raw_scenes[i])
        }

        for (var i = 0; i < scenes.length; i++) {
            for (var j = 0; j < scenes.length; j++) {
                if (scenes[i].start < scenes[j].start && scenes[j].start < scenes[i].end) {
                    scenes[i].end = Math.max(scenes[i].end, scenes[j].end)
                }
            }
        }

        skip.list = []
        for (var i = 0; i < scenes.length; i++) {
            skip.list[i] = {
                start: scenes[i].start * 1000,
                end: scenes[i].end * 1000
            }
        }
    },

    preview: function(start, end) {
        console.log("Starting preview of: ", start, "->", end)
        skip.load_list([{ start: start, end: end, skip: true }]);
        var u_start = sync.to_users_time(1000 * start)
        wc.send('seek-time', u_start / 1000 - 2.5)
        wc.send('pause', false)
    },

    want_to_see: function() {
        // Do not skip if we are absolutely lost
        if (sync.confidence == 0) return console.log("[want_to_see] (ERROR) We don't know where we are!");

        // Find next scene
        var c_time = video_time()
        var r_time = sync.to_reference_time(c_time);
        //console.log("[want_to_see] c_time: ", c_time,", r_time: ", r_time)
        var next_start = Infinity
        var next_end = Infinity
        for (var i = 0; i < skip.list.length; i++) {
            var time_to_end = skip.list[i].end - r_time + 160 // TOOD: do these margins properly
            var time_to_start = skip.list[i].start - r_time - 160 // TODO
            // Update times if scene is in the future, and the nearest one
            if (time_to_end > 0 && time_to_start < next_start) {
                next_start = time_to_start
                next_end = time_to_end
                //console.log("[want_to_see] next_start: ", next_start,", next_end: ", next_end)
            }
        }
        skip.next_start = next_start + c_time

        if (next_start < 200) {
            console.log("Scene almost here, wait ", next_start, "ms and skip: ")
            wc.send('skip-scene', { start: next_start + c_time, end: next_end + c_time })
        }
    }
}



var debug = {
    induced_sync_offset: 0, // Induce a fake sync offset (to see if system recovers)
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

    min_probability: 0.01,
    confidence: 0, // Probability [0,1] of current sync offset being right
    last_correct_sync: 0,
    offset: 0, // Best know time offset
    span: 20, // Search area radio
    histogram: {},

    need_hash: function() {
        if (reference.on_master) return false
        if (sync.confidence < 0.8) return true
        if (Math.abs(video_time() - sync.last_correct_sync) > 500) return true
        if (sync.last_was_weird) return true
        //if ( skip.next_start - video_time() < ) return true
    },

    // Locates the specified time in the reference film.
    to_reference_time: function(c_time) {
        return c_time + sync.offset // r - c = o
    },

    // Locates the specified time in the users film.
    to_users_time: function(r_time) {
        return r_time - sync.offset // r - c = o
    },

    update: function(c_hash, c_time) {
        if (reference.on_master) return
        // Check we have the data we need
        if (!c_hash || !c_time) return console.log("[update_sync] Missing c_time || c_hash");

        c_time += 1000 * debug.induced_sync_offset // DEBUG

        // Prepare data
        var histogram = sync.histogram
        var guessed_time = sync.to_reference_time(c_time);
        var guessed_block = Math.floor(guessed_time / 1000);

        // Compare user's frame with reference's frames in "span" blocks around the "guessed_time"
        var d_arr = {};
        var d_min = Infinity;
        for (var block = guessed_block - sync.span; block <= guessed_block + sync.span; block++) {
            var ref_data = reference.table[block]
            if (!ref_data) ref_data = []
            for (var r = 0; r < ref_data.length; r++) {
                // Calculate how different the frames are
                var d = sync.hamming_distance(ref_data[r][0], c_hash)
                var offset = "" + Math.round((ref_data[r][1] + block * 1000 - c_time) / 80)
                if (d < d_min) d_min = d;
                // Store value in array
                d_arr[offset] = d;
            }
        }

        // Update histogram with our new evidence
        var min_prob = sync.min_probability / sync.span / 12 / 2
        for (var offset in d_arr) {
            if (!d_arr.hasOwnProperty(offset)) continue;
            if (!histogram[offset] || histogram[offset] < min_prob) histogram[offset] = min_prob
            var evidence = 2 * (d_min + 8) / (d_arr[offset] + 2)
            histogram[offset] = histogram[offset] * evidence
        }

        // Normalize histogram
        var sum = 0
        for (var offset in histogram) {
            if (!histogram.hasOwnProperty(offset)) continue;
            sum += histogram[offset]
        }
        for (var offset in histogram) {
            if (!histogram.hasOwnProperty(offset)) continue;
            histogram[offset] = histogram[offset] / sum
        }


        // Find item with maximum probability
        var max = -Infinity;
        var m_offset = "0"
        for (var offset in histogram) {
            if (!histogram.hasOwnProperty(offset)) continue;
            if (histogram[offset] > max) {
                max = histogram[offset]
                m_offset = offset
            }
        }

        c_time -= 1000 * debug.induced_sync_offset // DEBUG
        // Update values with new sync
        sync.histogram = histogram
        sync.confidence = max
        if (sync.confidence > 0.8) {
            sync.last_correct_sync = c_time; // detect possible error (eg flat probability)
            sync.offset = parseInt(m_offset) * 80
        }
        sync.last_was_weird = (d_arr[m_offset] - d_min > 5) // check if current minimum match historic minimum

        console.log("[update_sync] Now is ", Math.floor(c_time / 1000), "s we are using ", sync.offset / 1000, "s offset. Last sync gave ", parseInt(m_offset) * 80 / 1000, "s offset with ", Math.round(100 * max), "% and d_min ", d_min, "(", d_arr[m_offset], ") adding ", sum)

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

    health_report: function() {
        if (!film_loaded) return

        if (!wc.webview && !wc.load()) return 1e6

        if (!wc.rect || Math.abs(video_time() - sync.last_rect) > 5000) {
            wc.send('get-rect', true) // fixme, this true might force update too often
            sync.last_rect = video_time()
        }

        if (skip.list.length == 0) return 0 // TODO: include last scene in the past as healthy

        if (reference.on_master) return 0

        var illness = Math.floor((video_time() - sync.last_correct_sync))
        return illness
    },

    last_rect: 0


}






var reference = {
    table: {},
    on_master: false,
    original_size: 0,

    load: function(src, ref) {
        if (!ref.src) { // there is no reference
            sync.offset = 0
            sync.confidence = 1
            reference.on_master = true
            ref = { "src": src }
        } else if (ref.src == src) { // we are the reference!
            sync.offset = 0
            sync.confidence = 1
            reference.on_master = true
        } else { // there is a reference, and it is not us
            reference.on_master = false
        }

        reference.table = ref
        reference.original_size = Object.keys(ref).length;
    },

    get_block: function(block_number) {
        var block = reference.table[Math.floor(block_number)] // Math.floor just in case
        if (!block) block = []
        return block
    },

    //add a hash-time pair to the ref list
    add_hash: function(c_hash, c_time) {
        if (!reference.need_hash(c_time)) return

        var block = Math.floor(c_time / 1000)
        var ms = c_time - 1000 * block
        if (!reference.table[block]) reference.table[block] = []

        reference.table[block].push([c_hash, ms])
        console.log("[add_hash] ", c_hash, block, ms)
    },

    need_hash: function(c_time) {
        if (!reference.on_master) return false
        var block = Math.floor(c_time / 1000)
        var ms = c_time - 1000 * block

        var ref_data = reference.table[block]
        if (!ref_data) ref_data = []
        for (var i = 0; i < ref_data.length; i++) {
            if (Math.abs(ref_data[i][1] - ms) < 50) return false
        }
        return true
    },

    nearest_scene_change: function(t_pressed, start) {
        var t_pressed = sync.to_reference_time(t_pressed)
        var max_distance = 0;
        var change_at = -1;
        var span = start ? 2000 : 1000
        var previous_hash = false
        for (var block = Math.floor((t_pressed - span) / 1000); block <= Math.floor(t_pressed / 1000); block++) {
            var ref_data = reference.table[block]
            if (!ref_data) ref_data = []
            for (var i = 1; i < ref_data.length; i++) {
                var t = ref_data[i][1] + block * 1000
                if (t < t_pressed - span || t > t_pressed) continue;
                if (previous_hash) {
                    var d = sync.hamming_distance(ref_data[i][0], previous_hash);
                    var dev = ((t_pressed - t) - span / 2) / 750
                    console.log(t, " -> ", d, " -> ", d - dev * dev)
                    d = d - dev * dev
                    if (d > max_distance) {
                        max_distance = d;
                        change_at = t - (120 * start)
                    };
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
    wc.send('seek-time', time / 1000)
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