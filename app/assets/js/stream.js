/* Require libraries */
const { remote, ipcRenderer } = require('electron')


//************************************************************************//
//                       EXTERNAL FUNCTIONS                               //
//************************************************************************//
var film_loaded = false;

function load_film(scenes, edit, ref) {
    console.log("loading film: ", scenes, edit, ref)
    set_globals(ref);

    load_skip_list(scenes);
    setMode(edit ? "editor" : "user")
    film_loaded = true;
}

function set_globals(ref) {
    syncRef = ref

    webview = false
    rect = false
    mode_after_preview = false
    webview_loaded = false

    s_start = false;

    // stats
    false_positive = 0
    false_negative = 0
    total = 0
    error = 0
    real_error = 0
    abs_error = 0;
}

function preview(start, end) {
    console.log("Starting preview of: ", start, "->", end)
    load_skip_list([{ start: start, end: end }]);
    var u_start = guess_users_time(1000 * start)
    seek_time(u_start - 5000);
    mode_after_preview = mode
    setMode("user")
}


function setMode(m) {
    mode = m;
    if (mode == "editor") {
        setTimer(80)
    } else {
        setTimer(1000)
    }
}

/**
 * Stop watching
 */
function end_capture() {
    //print_stats()
    setTimer(false)
    if (webview) webview.send("unload")
    webview = false
    rect = false
    if (mode == "editor") return get_purged_sync_data()
}

/**
 * Set how often frames are captured
 */
function setTimer(delay) {
    if (timer_delay == delay) return
    if (timer_id) clearInterval(timer_id);
    console.log("setting timer every ", delay)
    if (delay) timer_id = setInterval(get_thumbail, delay);
    timer_delay = delay;
}



/**
 * Mark current time as the start/end of a scene
 */
function mark_current_time() {
    if (!s_start) {
        s_start = nearest_scene_change(video_time(), true)
        webview.send('mute', true)
        console.log("Scene start marked at ", s_start)
    } else {
        var s_end = nearest_scene_change(video_time(), false)
        var scene = { start: s_start / 1000, end: s_end / 1000, tags: [], comment: "" }
        pause(true);
        webview.send('mute', false)
        console.log("Scene added ", s_start, " -> ", s_end)
        s_start = null;
        return scene;
    }
}



//************************************************************************//
//                         CORE FUNCTIONS                                 //
//************************************************************************//

/**
 * Set up communication with webview
 */
function load_webview() {

    /* Check there is a "webview" tag and that it is not already loaded */
    if (webview_loaded) return console.log("webview already loaded! ")
    webview = document.getElementsByTagName('webview')[0]
    if (!webview) return console.log("webview not ready yet ")

    /* Listen events from main thread */
    ipcRenderer.on('hash-ready', (event, arg) => {
        parseFrame(arg)
    })

    ipcRenderer.on('improved-rect-ready', (event, arg) => {
        // Check this is the improved version of the LAST rect (race conditions may happen)
        if (orect.x != arg.orect.x) return console.log("[improved-rect-ready] (ERROR) ask to improve ", rect, " got improved ", arg.rect)
        // Update rect
        rect = arg.rect
        console.log('[improved-rect-ready] got ', arg.rect)
    })

    /* Listen to events from player */
    webview.addEventListener('ipc-message', event => {
        if (event.channel == "video_rect") {
            var r = event.args[0];
            if (r.width == 0 || r.height == 0) return;
            orect = r;
            rect = r;
            ipcRenderer.send('improve-rect', { orect: orect })
        } else if (event.channel == "currentTime") {
            time = 1000 * event.args[0];
            cpu_time = Date.now();
        } else {
            console.log("ipc-message received: ", event.channel)
        }
    })

    webview_loaded = true

    return true;
}


/* Define some global variables */
var historic_sync = { t_bef: -1, t_min: -1, t_aft: -1, c_time: -1, span: 5 }
var rect = false;
var orect = false;
var time = 0;
var mode = "user";
var timer_id = false;
var timer_delay = 0;
var cpu_time = 0;
var webview = false;
var last_correct_sync = -Infinity


function health_report() {
    if (!film_loaded) return

    if (!webview && !load_webview()) return -1

    if (!rect || Math.abs(video_time() - last_rect) > 5000) {
        webview.send('get-rect', true) // fixme, this true might force update too often
        last_rect = video_time()
    }

    var illness = (mode == "editor") ? 0 : Math.floor((video_time() - last_correct_sync) / 2000)

    return illness
}

var last_rect = 0




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


/**
 * Capture current frame, generate hash and skip/watch/store accordingly
 */
function get_thumbail() {
    if (!rect) return;
    var time = video_time();
    if (time == last_frame_time) return console.log("[get_thumbail] Ignore get-hash, already parseFrame")
    last_frame_time = time
    ipcRenderer.send('get-hash', { time: time, rect: rect })
}
var last_frame_time = -Infinity

function parseFrame(arg) {
    // Check we didn't talke too long to process the frame (if we did, we don't really know when was it captured)
    var processing_time = video_time() - arg.time
    if (processing_time < 0 || processing_time > 50) {
        //TODO console.log("[parseFrame] (ERROR) Discarding frame, processing_time:  ", Math.floor(processing_time))
        return;
    }
    // Act according to mode "editor" or "user"
    if (mode == "editor") {
        add_to_ref_list(arg.hash, arg.time + processing_time / 2)
    } else {
        want_to_see(arg.hash, arg.time + processing_time / 2)
    }
}



/**
 * add the hash-time pair to the ref list
 * @param {c_hash} hash hash from current editors video
 * @param {c_time} time time in current editors video timing of the hash parameter
 * @returns {null}
 */
function add_to_ref_list(c_hash, c_time) {
    var block = Math.floor(c_time / 1000) // block = seconds
    if (!syncRef[block]) syncRef[block] = []
    var ms = Math.round(c_time - (block) * 1000)
    syncRef[block].push([c_hash, ms])
    console.log("[add_to_ref_list] ", c_hash, block, ms)
}


function load_skip_list(scenes) { // TODO: check this actually merge ovelaping scenes. Remove duplicates...
    for (var i = 0; i < scenes.length; i++) {
        for (var j = 0; j < scenes.length; j++) {
            if (scenes[i].start < scenes[j].start && scenes[j].start < scenes[i].end) {
                scenes[i].end = Math.max(scenes[i].end, scenes[j].end)
            }
        }
    }

    skip_list = []
    for (var i = 0; i < scenes.length; i++) {
        skip_list[i] = {}
        skip_list[i].start = scenes[i].start * 1000
        skip_list[i].end = scenes[i].end * 1000
        skip_list[i].skip = scenes[i].skip
    }
}


/**
 * Given a hash-time pair from the users video, decides wheter to watch it or to skip it
 * @param {string} hash hash from current users video
 * @param {number} time time of the hash parameter
 * @returns {json} { min: earliest possible point, center: most probable time, max: latest possible time}
 */
function want_to_see(hash, time) {

    // Find next scene
    var ref_times = find_time_in_reference(hash, time);
    var next_start = Infinity
    var next_end = Infinity
    for (var i = 0; i < skip_list.length; i++) {
        var time_to_end = skip_list[i].end - ref_times.t_bef
        var time_to_start = skip_list[i].start - ref_times.t_aft
        // Update times if scene is in the future, and the nearest one
        if (time_to_end > 0 && time_to_start < next_start) {
            next_start = time_to_start
            next_end = time_to_end
        }
    };

    // Do not skip if we haven't been able to sync a single frame
    if (video_time() - last_correct_sync == Infinity) return console.log("[want_to_see] (ERROR) We don't where we are!");

    if (next_start < 300) {
        console.log("Scene almost here, wait ", next_start, "ms and skip: ")
        skip_scene(next_start + time, next_end + time)
        setTimer(1000)
    } else if (next_start < 4000) {
        console.log("Scene is close (", next_start, "ms) check again a bit later: ")
        setTimer(250)
    } else {
        setTimer(1000)
    }
}





/* *
 * Locates the specified time in the reference film.
 * @param {number} our_time the time point (in our current version) that we want to find in the original film
 * @returns {json} { min: earliest possible point, center: most probable time, max: latest possible time}
 */
function guess_ref_time(c_time) {
    return (historic_sync.t_min - historic_sync.c_time + c_time)
}

/**
 * Try to guess the specified time in the users film.
 * @param {number} r_time a timestamp point (in our current version) that we want to find in the original film
 * @returns {json} { min: earliest possible point, center: most probable time, max: latest possible time}
 */
function guess_users_time(r_time) {
    return (historic_sync.c_time - historic_sync.t_min + r_time)
}

var h_offset = {}
var sync = {
    induced_error: 0,
    min_probability: 0.001,
    lost_timer: false
}

function find_time_in_reference(c_hash, c_time) {

    c_time += 1000 * sync.induced_error
    // Check we have the data we need
    if (!c_hash || !c_time) return console.log("[find_time_in_reference] Missing c_time || c_hash");

    // Prepare data
    var guessed_time = guess_ref_time(c_time);
    var guessed_block = Math.floor(guessed_time / 1000);
    var span = historic_sync.span;

    // Compare user's frame with reference's frames in "span" blocks around the "guessed_time"
    var d_arr = {};
    var d_min = Infinity;
    for (var block = guessed_block - span; block <= guessed_block + span; block++) {
        var ref_data = syncRef[block + ""];
        if (!ref_data) continue;
        for (var r = 0; r < ref_data.length; r++) {
            // Calculate how different the frames are
            var d = hamming_distance(ref_data[r][0], c_hash)
            var offset = "" + Math.round((ref_data[r][1] + block * 1000 - c_time) / 80)
            if (d < d_min) d_min = d;
            // Store value in array
            d_arr[offset] = d;
        }
    }

    for (var offset in d_arr) {
        if (!d_arr.hasOwnProperty(offset)) continue;
        if (!h_offset[offset] || h_offset[offset] < sync.min_probability) h_offset[offset] = sync.min_probability
        var evidence = (d_min + 8) / (d_arr[offset] + 2)
        h_offset[offset] = h_offset[offset] * evidence
    }

    // Normalize h_offset
    var sum = 0
    for (var offset in h_offset) {
        if (!h_offset.hasOwnProperty(offset)) continue;
        sum += h_offset[offset]
    }
    for (var offset in h_offset) {
        if (!h_offset.hasOwnProperty(offset)) continue;
        h_offset[offset] = h_offset[offset] / sum
    }


    // Find item with maximum
    var max = -Infinity;
    var m_offset = "0"
    for (var offset in h_offset) {
        if (!h_offset.hasOwnProperty(offset)) continue;
        if (h_offset[offset] > max) {
            max = h_offset[offset]
            m_offset = offset
        }
    }

    // detect possible error (eg flat probability)
    if (max > 0.5) {
        last_correct_sync = c_time;
        if (sync.lost_timer) {
            clearInterval(sync.lost_timer)
            sync.lost_timer = false;
        }
    } else if (!sync.lost_timer) {
        sync.lost_timer = setInterval(get_thumbail, 300);
    }

    var time_offset = parseInt(m_offset) * 80
    console.log("[find_time_in_reference] Best offset is ", time_offset / 1000, " with ", 100 * max, "%. Last d_min was ", d_min)
    historic_sync = { t_bef: c_time + time_offset - 80, t_min: c_time + time_offset, t_aft: c_time + time_offset + 80, c_time: c_time, span: 10, confidence: 0 }
    return historic_sync;
}

/* *
 * Locates the specified time in the reference film.
 * @param {string} c_hash hash of the frame we want to find
 * @param {number} c_time time (users) of the frame we want to find (to speed up a bit the search...)
 * @returns {json} { min: earliest possible point, center: most probable time, max: latest possible time}
 */
function find_time_in_reference2(c_hash, c_time) {

    // Check we have the data we need
    if (!c_hash || !c_time) return;

    // Prepare data
    var guessed_time = guess_ref_time(c_time);
    var guessed_block = Math.floor(guessed_time / 1000);
    var span = historic_sync.span;

    // Compare user's frame with reference's frames in "span" blocks around the "guessed_time"
    var d_arr = {};
    var d_min = Infinity;
    var t_min = null;
    var n_blocks = 0;
    for (var block = guessed_block - span; block <= guessed_block + span; block++) {
        var ref_data = syncRef[block + ""];
        if (!ref_data) continue;
        n_blocks++;
        for (var r = 0; r < ref_data.length; r++) {
            // Calculate how different the frames are
            var d = hamming_distance(ref_data[r][0], c_hash)
            var t = ref_data[r][1] + block * 1000
            // Update best matching point
            if (d < d_min) {
                t_min = t;
                d_min = d;
            }
            // Store value in array
            d_arr[t] = d;
        }
    }

    // Find error interval and try pick the best "t_min"
    var d_min2 = Infinity;
    var t_bef = Infinity;
    var t_aft = -Infinity;
    var th = d_min * 1.3;
    for (var t_str in d_arr) {
        var t = parseInt(t_str)
        // Find error interval
        if (d_arr[t_str] <= th) {
            if (t_bef > t) t_bef = t;
            if (t_aft < t) t_aft = t;
        }
        // If we got multiple frames with distance d_min, pick the one that is more consistent with historic data
        if (d_arr[t_str] < d_min + 1) {
            var d2 = Math.abs(guessed_time - t);
            if (d2 < d_min2) {
                t_min = t;
                d_min2 = d2;
            }
        }
    }

    // Detect/guess/bet wheter we have an error or not
    var badness = detect_error(d_min, Math.abs(t_aft - t_bef), n_blocks, !syncRef[guessed_block + ""])
    //var error_detected = (d_min > 40 || Math.abs(t_aft - t_bef) > 600 || n_blocks < 5 || !syncRef[guessed_block + ""])
    total++;

    // Some stats (useful when we knew the time offset in advance and want to check the sync accuracy)

    /*var error_th = 150; // Error threshold for stats only
    var offset = 0; // Known offset
    total++
    if (Math.abs(c_time - t_min + offset) > error_th) {
        error++
        if (!error_detected) false_negative++;
    } else {
        if (error_detected) false_positive++;
    }
    console.log(historic_sync, c_time - t_min + offset)*/


    // Make history :)
    if (badness == 0) {
        console.log("[find_time_in_reference] Looks like we got the right sync. Offset around: ", t_min - c_time)
        span = Math.max(historic_sync.span - 20, 5);
        last_correct_sync = c_time;
    } else {
        error++;
        var elapsed_time = c_time - historic_sync.c_time;
        t_bef = historic_sync.t_bef + elapsed_time;
        t_aft = historic_sync.t_aft + elapsed_time;
        t_min = historic_sync.t_min + elapsed_time;
        span = Math.min(historic_sync.span + badness, 300);
        console.log("[find_time_in_reference] Using historic_sync. Badness: " + badness + ". Offset was around: ", t_min - c_time)
    }
    historic_sync = { t_bef: t_bef, t_min: t_min, t_aft: t_aft, c_time: c_time, span: Math.round(span) };

    // More stats after corrections
    /*abs_error += Math.abs(c_time - t_min + offset)
    if (Math.abs(c_time - t_min + offset) > error_th) real_error++;*/

    // Return
    return historic_sync;

}

function detect_error(d_min, possible_error, n_blocks, missing_block) {
    if (missing_block) return 4
    if (d_min < 10) return 0
    if (d_min < 20 && possible_error < 2000) return 1
    if (d_min < 30 && possible_error < 1000) return 2
    if (d_min < 40 && possible_error < 500) return 3
    console.log("[detect_error] looks like we are lost...")
    return 5

}


/**
 * Find and return the sharpest scene change
 * @param {number} start wheter it's the start or the end of the scene
 * @param {number} t_pressed time the mark scene button was pressed
 * @returns {number} timestamp of the first frame after a sharp scene change
 */
function nearest_scene_change(t_pressed, start) {
    var max_distance = 0;
    var change_at = -1;
    var span = start ? 2000 : 1000
    var previous_hash = false
    for (var block = Math.floor((t_pressed - span) / 1000); block <= Math.floor(t_pressed / 1000); block++) {
        var ref_data = syncRef[block + ""];
        if (!ref_data) continue;
        for (var i = 1; i < ref_data.length; i++) {
            var t = ref_data[i][1] + block * 1000
            if (t < t_pressed - span || t > t_pressed) continue;
            if (previous_hash) {
                var d = hamming_distance(ref_data[i][0], previous_hash);
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
}




//************************************************************************//
//                        HELPER FUNCTIONS                                //
//************************************************************************//

function seek_time(time) {
    if (!webview) return console.log("[seek_time] (ERROR) Trying to skip, but we don't have a webview!");
    webview.send('seek-time', time/1000)
}

function skip_scene(start, end) {
    if (!webview) return console.log("[skip_scene] (ERROR) Trying to skip, but we don't have a webview!");
    console.log("[skip_scene] skipping ", start, " -> ", end)
    if (mode_after_preview) {
        setMode(mode_after_preview)
        mode_after_preview = false;
    }
    webview.send('skip-scene', { start: start, end: end })
}

function go_to_frame(time) {
    console.log("going to frame, at time ", time)
    webview.send('go-to-frame', time)
}

function pause(state) {
    if (!webview) return;
    webview.send('pause', !!state)
}


/**
 * Calculate the hamming distance between two base64 encoded strings
 * @param {string} a hash one
 * @param {string} b hash two
 * @returns {number} hamming distance between hashes
 */
function hamming_distance(a, b) {
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
}


/**
 * Generates a hash from an image in bitmap format
 * @param {string} data bitmap containing the image we want the hash from
 * @returns {string} String containing the hash
 */
function bitmap_to_hash(data) {
    var base64 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
    var hash = ""
    for (var i = 4; i < data.length - 20; i += 24) {
        var n = (data[i - 4] > data[i]) * 1
        n += (data[i - 4 + 4] > data[i + 4]) * 2
        n += (data[i - 4 + 8] > data[i + 8]) * 4
        n += (data[i - 4 + 12] > data[i + 12]) * 8
        n += (data[i - 4 + 16] > data[i + 16]) * 16
        n += (data[i - 4 + 20] > data[i + 20]) * 32
        hash += base64.charAt(n)
    };
    return hash;
}

function print_stats() {
    /*for (var i = 200; i >= 0; i--) {
      if ( !hash_list[i] ) continue;
      var block = hash_list[i]
      for (var j = block.length - 1; j >= 0; j--) {
        find_time_in_reference( block[j][0], block[j][1]+i*1000)
      }
    }*/
    console.log(false_negative, false_positive, total, error, real_error)
}



// Check we don't have weird things
function get_purged_sync_data() {
    var purged_ref = {}
    last_t = -Infinity
    for (var seconds in syncRef) {
        if (!syncRef.hasOwnProperty(seconds)) continue;
        var block = syncRef[seconds]
        purged_ref[seconds] = []
        for (var i = 0; i < block.length; i++) {
            if (Math.abs(block[i][1] - last_t) < 50) {
                console.log("discarding frame! at ", seconds, i)
                continue
            }
            last_t = block[i][1]
            purged_ref[seconds].push([block[i][0], block[i][1]])
        }
    }
    console.log("purged_ref; ", purged_ref)
    return purged_ref
}



// Draw a rectangle around the rect (to check it has been detected properly)
function draw(v) {
    webview.send('draw-rect', { rect: rect, visibility: v })
}




// Print timings on console
function cb(what) {
    if (what == "start") {
        startScreenshoting = Date.now()
    } else {
        console.log(what, ": ", Date.now() - startScreenshoting)
    }
}
var startScreenshoting;