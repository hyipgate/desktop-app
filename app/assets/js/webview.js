const { ipcRenderer } = require('electron')


vc = {

    ipcRenderer: ipcRenderer,
    div: null,
    isDialogOpened: false,
    paused_before_dialog: false,

    listen: function() {

        vc.ipcRenderer.on('mark-current-time', function(event) {
            if (vc.isloaded()) vc.mark_current_time()
        });

        vc.ipcRenderer.on('go-to-frame', function(event, time) {
            if (vc.isloaded()) vc.seek_time(time, true)
        });

        vc.ipcRenderer.on('preview', function(event, scene) {
            if (!vc.isloaded()) return
            vc.preview_skip = autoSync.sync_scene(scene)
            var start = vc.preview_skip.times[vc.meta.src][0]
            vc.seek_time(start - 2500)
            vc.pause(false)
        });


        vc.ipcRenderer.on('dialog-visible', function(event, visible) {
            if (!vc.isloaded()) return
            if (visible && !vc.isDialogOpened) {
                vc.paused_before_dialog = vc.video.paused
            }
            vc.isDialogOpened = visible
            vc.pause(visible || vc.paused_before_dialog)
        });

        vc.ipcRenderer.on('load-new-scenes', function(event, scenes) {
            ref.scenes = scenes;
        });

        vc.ipcRenderer.on('load-new-reference', function(event, tables) {
            console.log('load-new-reference', tables)
            ref.tables = tables
            if (!ref.tables[vc.meta.src]) {
                ref.tables[vc.meta.src] = { src: vc.meta.src }
            }
            ref.original_size = Object.keys(ref.tables[vc.meta.src]).length
        });

        vc.ipcRenderer.on('hash-ready', (event, arg) => {
            console.log("We got a new hash!")
            if (!vc.isloaded()) return
            var processing_time = vc.get_time() - arg.time
            if (processing_time < 0 || processing_time > 50) {
                console.log("[hash-ready] (ERROR) Discarding frame, processing_time:  ", Math.floor(processing_time))
                return;
            }
            // Add hash to list
            ref.add_hash(arg.hash, arg.time + processing_time / 2)
        });

        vc.ipcRenderer.on('get-scenes', (event) => {
            if (!vc.isloaded()) return
            vc.ipcRenderer.sendToHost('updated-sync', ref.scenes);
        });

        vc.ipcRenderer.on('get-reference', (event) => {
            if (!vc.isloaded()) return
            if (ref.original_size < Object.keys(ref.tables[vc.meta.src]).length) {
                vc.ipcRenderer.sendToHost('updated-reference', ref.tables[vc.meta.src]);
            }
        });

        window.addEventListener('beforeunload', function(event) {
            if (!vc.isloaded()) return
            if (ref.original_size < Object.keys(ref.tables[vc.meta.src]).length) {
                vc.ipcRenderer.sendToHost('updated-reference', ref.tables[vc.meta.src]);
            }
            vc.ipcRenderer.sendToHost('updated-sync', ref.scenes);
        });

    },

    addStyleString: function(str) {
        var node = document.createElement('style');
        node.innerHTML = str;
        document.body.appendChild(node);
    },

    reload: function() {
        console.log("(Re)loading!")
        vc.meta = {}
        ref.scenes = []
        ref.tables = []
        vc.video = null
        vc.loaded = false
        vc.preview_skip = null
    },

    load: function() {

        if (!vc.timer_id) vc.timer_id = setInterval(function() {
            if (!vc.isloaded()) return;
            if (vc.meta.url != window.location.href) vc.reload()
            vc.check_needs_skip();
            autoSync.capture_screen();
        }, 80);


        var video = document.getElementsByTagName("video")
        if (video.length != 1) {
            console.log("[webview] loading fail, more than one video, ie. ", video.length)
            return;
        }
        // TODO: perform duration checks on video...

        vc.video = video[0];



        // Extract metadata
        var url = window.location.href
        var metadata = {
            internal_id: 0,
            duration: vc.video.duration * 1000,
            title: "",
            epsisodeTitle: "",
            season: null,
            episode: null,
            provider: url.match(/www.([^\/]+)/)[1],
            url: url
        }
        if (url.indexOf("netflix") != -1) {
            metadata.seek_model = "netflix"
            metadata.internal_id = url.match(/watch\/([0-9]+)/)[1]
            var title = document.getElementsByClassName('video-title')[0].firstChild
            if (title.childElementCount != 0) {
                var children = title.childNodes;
                metadata.title = children[0].innerHTML
                var series = children[1].innerHTML.split(':')
                metadata.season = parseInt(series[0].substring(1))
                metadata.episode = parseInt(series[1].substring(1))
                metadata.epsisodeTitle = children[2].innerHTML
            } else {
                metadata.title = title.innerHTML
            }
            metadata.src = "ntf_" + metadata.internal_id + "_" + Math.round(metadata.duration / 1000)
            // TODO: inject relevant CSS
            //document.querySelectorAll('a[href*="70195800"] img')[1].style.webkitFilter = "blur(15px)";
            vc.addStyleString('a[href*="80186863"] {filter : grayscale(100%) blur(2px); pointerEvents: none; }')
        } else if (url.indexOf("amazon") != -1) {
            metadata.seek_model = "amazon"
        } else {
            metadata.seek_model = "normal"
        }
        vc.ipcRenderer.sendToHost('updated-metadata', metadata);
        vc.meta = metadata
        console.log("[updated-metadata]", metadata)

        vc.div = document.createElement("div");
        document.body.appendChild(vc.div)
        vc.loaded = true
    },


    marking_started: false,
    blur_level: 40,
    mark_current_time: function() {
        var start = vc.marking_started
        if (!start) {
            vc.marking_started = ref.nearest_scene_change(vc.get_time(), true) //TODO
            vc.video.playbackRate = 2
            vc.video.style.webkitFilter = "blur(" + parseInt(vc.blur_level) + "px)";
            vc.mute(true)
            console.log("Scene start marked at ", start)
        } else {
            var end = ref.nearest_scene_change(vc.get_time(), false)
            var scene = { tags: [], comment: "", times: {}, id: ref.random_id() }
            scene.times[vc.meta.src] = [start, end, 1]
            vc.ipcRenderer.sendToHost('marked-scene', scene)
            vc.video.playbackRate = 1
            vc.video.style.webkitFilter = "blur(0px)";
            vc.pause(true)
            vc.mute(false)
            vc.marking_started = false
            console.log("Scene added ", start, " -> ", end)
        }
    },

    fast_rate_til: function(time, pause_after_seek) {
        if (time - vc.get_time() < 40) return
        vc.pause(false)
        // check periodically if we have reach the desired time, then stopped
        var timer = setInterval(function() {
            var length = time - vc.get_time()
            console.log("[fast_rate_til] Time left ", length / 1000, "s")
            vc.video.playbackRate = Math.max(1, Math.min(8, length / 1000))
            if (length < 60) {
                vc.pause(pause_after_seek)
                clearInterval(timer)
            }
        }, 80);
    },

    position: null,
    netflix_seek: function(time) {
        var length = time - vc.get_time()
        if (length < 1000 && length > 0) return

        // Allow pointer events
        var no_pointer = document.getElementsByClassName("PlayerControls--control-element-hidden")
        for (var i = 0; i < no_pointer.length; i++) no_pointer[i].style.pointerEvents = "auto"

        // Convert time to %
        //var scrubberHead = document.getElementsByClassName("scrubber-head")[0]
        //var factor = time / scrubberHead.getAttribute("aria-valuemax")

        var factor = time / vc.meta.duration

        // Show controls (we need the position of the control bar, so we need to render it)
        var scrubber = document.getElementsByClassName('track')[0];
        //var controls = document.getElementsByClassName('controls')[0];
        //controls.className = controls.className.replace("inactive", "active")
        //controls.style.visibility = "hidden" // but we can hide it from the user :)
        vc.video.dispatchEvent(new MouseEvent('mousemove', {
            'view': window,
            'bubbles': true,
            'currentTarget': vc.video
        }));

        // Get the position of the control bar
        var new_position = scrubber.getBoundingClientRect();
        if (new_position.left != 0) {
            console.log("using new position")
            vc.position = new_position
        } else if (vc.position) {
            console.log("using old position...")
        } else {
            console.log("Panic! Unable to jump, what shall we do??")
            return
        }

        // Now do an actual jump
        eventOptions = {
            'view': window,
            'bubbles': true,
            'cancelable': true,
            'clientX': vc.position.left + vc.position.width * factor,
            'clientY': vc.position.top + vc.position.height / 2
        };
        console.log("netflix_seek: ", vc.position.left, " + ", vc.position.width, " * ", factor, " = ", eventOptions.clientX)
        // make the "trickplay preview" show up
        scrubber.dispatchEvent(new MouseEvent('mouseover', eventOptions));
        // click
        scrubber.dispatchEvent(new MouseEvent('mousedown', eventOptions));
        scrubber.dispatchEvent(new MouseEvent('mouseup', eventOptions));
        scrubber.dispatchEvent(new MouseEvent('mouseout', eventOptions));

        //controls.style.visibility = "visible"

    },

    seek_time: function(time, pause_after_seek) {
        console.log("[seek_time] seeking time ", time)
        // Check objective time is within range
        if (!time || time < 0 || time > vc.meta.duration) {
            console.log("Invalid time ", time, ", video length is ", vc.meta.duration)
            return
        }

        if (vc.meta.seek_model == "normal") {
            vc.video.currentTime = time / 1000
            vc.pause(pause_after_seek)
        } else if (vc.meta.seek_model == "netflix") {
            vc.netflix_seek(time)
            // netflix jumps are not very accurate, move fast until we reach desired time
            vc.fast_rate_til(time, pause_after_seek)
        } else {
            vc.fast_rate_til(time, pause_after_seek)
        }
    },

    // Get current time in milliseconds (all times are always in milliseconds!)
    get_time: function() {
        return vc.video.currentTime * 1000
    },



    preview_skip: null,
    skipping: false,
    check_needs_skip: function() {
        if (vc.isDialogOpened) return

        if (!vc.meta || !vc.meta.src) return // TODO: should not be silent

        var src = vc.meta.src
        var now = vc.get_time()
        var next_good = 0


        // Our skip_list is the main skip_list, unless we are on preview mode
        if (vc.preview_skip) {
            var skip_list = [vc.preview_skip] // should we replace or add it as a new one?
        } else {
            var skip_list = ref.scenes
        }


        // Check if we are on a bad time
        for (var i = 0; i < skip_list.length; i++) {
            var start = skip_list[i].times[src][0];
            var end = skip_list[i].times[src][1] + 150;
            // Math.max(next_good+500,now) if the scene starts 0.5s after the end of the skip, consider they overlap
            if (Math.max(next_good + 500, now) > start && now < end) {
                next_good = Math.max(next_good, end)
            }
        }

        if (next_good == 0 && vc.skipping) {
            console.log("[check_needs_skip] Back to normal")
            if (vc.preview_skip) {
                vc.ipcRenderer.sendToHost('preview-finished', vc.preview_skip)
                vc.preview_skip = null // preview skips only once 
            }
            vc.video.style.visibility = 'visible';
            vc.mute(false)
            vc.skipping = false
        } else if (next_good != 0 && !vc.skipping) {
            console.log("[check_needs_skip] Bad times!")
            vc.video.style.visibility = 'hidden';
            vc.mute(true)
            vc.seek_time(next_good)
            vc.skipping = true
        }
    },

    mute: function(state) {
        vc.video.muted = state;
    },

    pause: function(state) {
        if (state) {
            vc.video.pause();
        } else {
            vc.video.play();
        }
    },

    isloaded: function() {
        if (!vc.loaded) vc.load();
        return (!!vc.loaded)
    }

}

vc.listen()
vc.load()

/*window.addEventListener('hashchange', function() {
    console.log("hashchange")
    vc.reload()
})*/



autoSync = {

    min_confidence: 0,

    capture_screen: function() {
        if (vc.isDialogOpened) return
        if (vc.video.paused) return
        if (!ref.need_hash()) return
        console.log("asking for new hash")
        autoSync.get_video_rect() // TODO: how often do we need to do this?
        vc.ipcRenderer.send('get-hash', { time: vc.get_time(), rect: autoSync.rect })
    },

    get_hashes: function(src, time, span) {
        if (!ref.tables[src]) {
            console.log("[get_hashes] we got no reference table")
            return {}
        }
        var first_block = Math.floor(time / 1000) - span;
        var last_block = Math.floor(time / 1000) + span;
        var table = {}
        for (var block = first_block; block <= last_block; block++) {
            //if ( block > first_block + span && block < last_block - span ) continue
            var data = ref.tables[src][block] || []
            for (var r = 0; r < data.length; r++) {
                table.push([data[r][0], data[r][1] + block * 1000])
            }
        }
        return table
    },


    sync_scene: function(scene) {
        var src = vc.meta.src
        var confidence_th = 0.8
        // If we don't have any data, make a first guess
        if (!scene.times[src] || scene.times[src].length < 3) {
            scene.times[src] = [0, 0, 0]
        }
        // If the scene was manually set by a human, there is nothing to sync really
        if (scene.times[src][2] >= confidence_th) {
            return scene
        }

        var start = scene.times[ref][0]

        // Prepare data
        var d_array = {}
        var d_count = {}
        var our_data = autoSync.get_hashes(src, start, 20)

        // Compare hash
        for (var ref_src in scene.times) {
            if (ref_src == src) continue // makes no sense to sync against ourselves
            if (scene.times[ref_src][2] < confidence_th) continue // if the times are not very sure, do not use
            var ref_data = autoSync.get_hashes(ref_src, start, 20)
            var ref_start = scene.times[ref_src][0]

            for (var i = 0; i < our_data.length; i++) {
                for (var j = 0; j < ref_data.length; j++) {
                    var d = autoSync.hamming_distance(our_data[r][0], ref_data[r][0])
                    // TODO: penalize low accuracy syncs, frames far from sync times
                    var t = "" + Math.round((our_data[r][0] + ref_start - ref_data[r][0]) / 80)
                    if (d_array[t] == undefined) {
                        d_count[t] = 1;
                        d_array[t] = d;
                    } else {
                        d_count[t] += 1;
                        d_array[t] += d;
                    }
                }
            }
        }
        // We are interested on the average
        var d_norm = {}
        for (var t in d_array) {
            if (d_count[t] < 5) continue // Drop points with not enough samples
            d_norm[t] = d_array[t] / d_count[t]
        }

        // Find minimum
        var t_min = 0;
        var t_min2 = 0;
        for (var t in d_norm) {
            if (d_norm[t] < d_norm[t_min]) {
                t_min2 = t_min
                t_min = t
            } else if (d_norm[t] < d_norm[t_min2]) {
                t_min2 = t
            }
        }
        // 
        var confidence = (d_norm[t_min] - d_norm[t_min2]) / d_norm[t_min]
        scene.times[src] = [start, end, confidence]

        // Update data...
        for (var i = 0; i < ref.scenes.length; i++) {
            if (ref.scenes[i].id != scene.id) continue
            ref.scenes[i] = scene
            break
        }
        return scene
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

    update_sync: function() {
        var time = vc.get_time()
        if (vc.preview_skip) {
            var scenes = [vc.preview_skip]
        } else {
            var scenes = ref.scenes
        }
        var min_confidence = 1
        for (var i = 0; i < scenes.length; i++) {
            var our_time = scenes[i].times[src]
            if (our_time[0] < time + 180) continue
            if (our_time[1] > time) continue
            var synced_scene = autoSync.sync_scene(scenes[i])
            if (synced_scene[src][2] < min_confidence) {
                min_confidence = synced_scene[src][2]
            }
        }
        autoSync.min_confidence = min_confidence
        return min_confidence
    },

    rect: 0,
    get_video_rect: function() {
        var video = vc.video;
        var video_rect = video.getBoundingClientRect();
        var video_ratio = video.videoWidth / video.videoHeight
        var display_ratio = video.offsetWidth / video.offsetHeight
        if (video_ratio > display_ratio) {
            var w = video.offsetWidth
            var h = video.offsetWidth / video_ratio
            var t = video_rect.top + (video.offsetHeight - h) / 2
            var l = video_rect.left
        } else {
            var w = video.offsetHeight * video_ratio
            var h = video.offsetHeight
            var t = video_rect.top
            var l = video_rect.left + (video.offsetWidth - w) / 2
        }
        autoSync.rect = { y: Math.round(t), x: Math.round(l), width: Math.round(w), height: Math.round(h) }
    },

    draw_rect: function(h, t, l, w, v) {
        vc.div.style = "visibility:" + v + "; position: fixed; z-index: 998; top: " + (t - 4) + "px; left: " + (l - 4) + "px; width: " + w + "px; height: " + h + "px; border: 4px solid #73AD21;"
    }
}

// REFerence
ref = {
    scenes: [],
    tables: [],

    //add a hash-time pair to the ref list
    add_hash: function(c_hash, c_time) {
        var block = Math.floor(c_time / 1000)
        var ms = c_time - 1000 * block
        var table = ref.tables[vc.meta.src]
        if (!table[block]) table[block] = []
        table[block].push([c_hash, ms])
        console.log("[add_hash] ", c_hash, block, ms)
        //
        autoSync.update_sync()
    },

    need_hash: function(c_time) {
        var block = Math.floor(c_time / 1000)
        var ms = c_time - 1000 * block
        var ref_data = ref.tables[vc.meta.src][block] || []
        // if there is another hash at under 50ms, then we don't need a hash
        for (var i = 0; i < ref_data.length; i++) {
            if (Math.abs(ref_data[i][1] - ms) < 50) return false
        }
        return true
    },

    nearest_scene_change: function(t_pressed, start) {
        var max_distance = 0;
        var change_at = -1;
        var span = start ? 2500 : 1000

        var our_hashes = autoSync.get_hashes(t_pressed, vc.meta.src, span)
        var previous_hash = false
        for (var i = 1; i < our_hashes.length; i++) {
            var t = our_hashes[i][1] + block * 1000
            if (t < t_pressed - span || t > t_pressed) continue;
            if (previous_hash) {
                var d = autoSync.hamming_distance(our_hashes[i][0], previous_hash);
                if (start && d > max_distance) {
                    max_distance = d
                    change_at = t - 120
                } else if (!start && d >= max_distance) {
                    max_distance = d
                    change_at = t + 120
                }
            }
            previous_hash = our_hashes[i][0]
        };
        console.log("Pressed at: ", t_pressed, " scene change at: ", change_at)
        if (change_at == -1) change_at = t_pressed - span
        return change_at;
    },

    random_id: function() {
        var text = ""
        var possible = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
        for (var i = 0; i < 10; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        };
        return text;
    }
}