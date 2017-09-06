const { ipcRenderer } = require('electron')

handpick = {

    ipcRenderer: ipcRenderer,

    fast_rate: 8,

    div: null,

    seek_backwards: false,

    seek_fordward: false,

    listen: function() {
        handpick.ipcRenderer.on('go-to-frame', function(event, data) {
            if (handpick.isloaded()) handpick.go_to_frame(data)
        });

        handpick.ipcRenderer.on('mute', function(event, data) {
            if (handpick.isloaded()) handpick.mute(data)
        });

        handpick.ipcRenderer.on('unload', function(event, data) {
            if (handpick.isloaded()) handpick.unload()
        });

        handpick.ipcRenderer.on('pause', function(event, data) {
            if (handpick.isloaded()) handpick.pause(data)
        });

        handpick.ipcRenderer.on('get-rect', function(event, data) {
            if (handpick.isloaded()) handpick.get_rect(data)
        });

        handpick.ipcRenderer.on('seek-time', function(event, data) {
            if (handpick.isloaded()) handpick.seek_time(data)
        });

        handpick.ipcRenderer.on('skip-scene', function(event, data) {
            if (handpick.isloaded()) handpick.skip_scene(data.start / 1000, data.end / 1000)
        });

        handpick.ipcRenderer.on('draw-rect', function(event, data) {
            if (handpick.isloaded()) handpick.draw_rect(data.rect.height, data.rect.y, data.rect.x, data.rect.width, data.visibility)
        });

    },

    load: function() {
        var video = document.getElementsByTagName("video")
        if (video.length != 1) {
            console.log("[webview] loading fail, more/less than one video, ie. ", video.length)
            return;
        }
        if (video[0].readyState < 1 || !video[0].currentTime || video[0].currentTime < 1) {
            console.log("[webview] too early to tell if this is the video, ie. ", video[0].currentTime)
            return;
        }
        if (video[0].duration < 30) {
            console.log("[webview] video too short to be a film :), ie. ", video[0].duration)
            return;
        }
        handpick.video = video[0];
        handpick.video.onseeked = function() { handpick.ipcRenderer.sendToHost("seek"); }
        handpick.video.ontimeupdate = function() { handpick.get_current_time() };

        var url = window.location.href
        if (url.indexOf("netflix") != -1 || url.indexOf("amazon") != -1) {
            handpick.seek_fordward = false
            handpick.seek_backwards = false
        } else {
            handpick.seek_fordward = true
            handpick.seek_backwards = true
        }

        handpick.div = document.createElement("div");
        document.body.appendChild(handpick.div)
    },

    unload: function() {
        handpick.video = null
    },

    fast_rate_til: function(time) {
        var now = handpick.video.currentTime
        var stop_time = 1000*(time - now) / handpick.fast_rate
        console.log( "[fast_rate_til] ",stop_time )
        if ( stop_time < 25 ) return // Doesn't make sense to go fast rate a few ms

        handpick.video.playbackRate = handpick.fast_rate
        setTimeout( function () {
            console.log("[fast_rate_til] setting normal rate ", handpick.video.currentTime )
            handpick.video.playbackRate = 1;
        }, stop_time );
    },

    seek_time: function(time) {
        console.log("[seek_time] seeking time ", time)
        var video = handpick.video;
        var now = video.currentTime
        if (now > time) {
            if (handpick.seek_backwards) {
                video.currentTime = time
            } else {
                console.log("[seek_time] Sorry unable to seek backwards")
            }
        } else {
            if (handpick.seek_fordward) {
                video.currentTime = time
            } else {
                handpick.fast_rate_til(time)
            }
        }
    },

    skipping: false,
    skip_scene: function(start, end) {
        if (handpick.skipping == start + "|" + end) return console.log("[skip_scene] already skipping " + start + "->" + end)
        handpick.skipping = start + "|" + end;
        var video = handpick.video;
        var hidden = false
        var timer_id = setInterval(function() {
            var now = video.currentTime
            console.log("[skip_scene] checking ", now, " ", start, " ", end, " ", timer_id)
            if (now > end) {
                clearInterval(timer_id)
                video.playbackRate = 1
                handpick.video_fade_in()
                handpick.skipping = false
            } else if (now > start - 60 / 1000 && !hidden) {
                handpick.video_fade_out()
                handpick.seek_time(end)
                hidden = true
            }
        }, 30)
    },

    setTimer: function(delay) {
        if (timer_delay == delay) return
        if (timer_id) clearInterval(timer_id);
        console.log("setting timer every ", delay)
        if (delay) timer_id = setInterval(get_thumbail, delay);
        timer_delay = delay;
    },

    mute: function(state) {
        handpick.video.muted = state;
    },

    pause: function(state) {
        if (state) {
            handpick.video.pause();
        } else {
            handpick.video.play();
        }
    },

    go_to_frame: function(time) {
        if (!time) return;
        var now = handpick.video.currentTime
        if (handpick.seek_fordward && handpick.seek_backwards ) {
            handpick.video.currentTime = time
        }
    },

    toms: function(time, factor) {
        console.log("checking again in ", time * 1000 / factor, "ms")
        return time * 1000 / factor
    },

    video_fade_in: function() {
        console.log("Unhiding player ")
        var video = handpick.video;
        video.style.visibility = 'visible';
        video.muted = false;
        setTimeout(function() {
            video.volume = video.volume * 2
        }, 30)
    },

    video_fade_out: function() {
        console.log("Hiding player ")
        var video = handpick.video;
        video.style.visibility = 'hidden';
        video.volume = video.volume / 2
        setTimeout(function() {
            video.muted = true;
        }, 30)
    },

    focus_video: function() {
        // remove all video elements but ours (to make sure we are controlling the right one)
        var video_list = document.getElementsByTagName("video")
        for (var i = video_list.length - 1; i >= 1; i--) {
            video_list[i].parentElement.removeChild(video_list[i]);
        }
        // hide all page but our video
        document.body.style.visibility = "hidden"
        handpick.video.style = "position: fixed; right: 0; bottom: 0; max-width: 100%; max-height: 100%;  width: auto; height: auto; z-index: 999;   background: #FFFFF;  background-size: cover; visibility:visible;"
        // hide all iframes (seem to ignore the body visibility hidden)
        var iframes = document.querySelectorAll("iframe");
        for (var i = 0; i < iframes.length; i++) {
            iframes[i].style.visibility = 'hidden';
        }
    },

    get_video_rect: function() {
        var video = handpick.video;
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
        return { y: Math.round(t), x: Math.round(l), width: Math.round(w), height: Math.round(h) }
    },

    draw_rect: function(h, t, l, w, v) {
        handpick.div.style = "visibility:" + v + "; position: fixed; z-index: 998; top: " + (t - 4) + "px; left: " + (l - 4) + "px; width: " + w + "px; height: " + h + "px; border: 4px solid #73AD21;"
    },

    isloaded: function() {
        if (!handpick.video) {
            handpick.load();
        };
        return (!!handpick.video)
    },

    get_rect: function(force) {
        var r = handpick.get_video_rect();
        var lr = handpick.last_rect;
        if (force || !lr || r.width != lr.width || r.height != lr.height || r.x != lr.x || r.y != lr.y) {
            handpick.ipcRenderer.sendToHost("video_rect", r)
            handpick.last_rect = r
        }
    },

    get_current_time: function() {
        handpick.ipcRenderer.sendToHost("currentTime", handpick.video.currentTime)
    }

}

handpick.listen()