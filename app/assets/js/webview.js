
const {ipcRenderer} = require('electron')

handpick = {

  ipcRenderer: ipcRenderer,

  fast_rate: 8,

  mode: 1,

  div: null,

  listen: function() {
      handpick.ipcRenderer.on( 'go-to-frame', function( event, data ) {
          handpick.go_to_frame( data )
      } );

      handpick.ipcRenderer.on( 'mute', function( event, data ) {
          handpick.mute( data )
      } );

      handpick.ipcRenderer.on( 'pause', function( event, data ) {
          handpick.pause( data )
      } );

      handpick.ipcRenderer.on( 'get-rect', function( event, data ) {
          handpick.get_rect()
      } );

      handpick.ipcRenderer.on( 'hide-until', function( event, data ) {
          handpick.hide_until( data )
      } );

      handpick.ipcRenderer.on( 'draw-rect', function( event, data ) {
          handpick.draw_rect( data.rect.height, data.rect.y, data.rect.x, data.rect.width, data.visibility )
      } );

  },

  load : function () {
    var video = document.getElementsByTagName("video")
    if ( video.length != 1 ){
      console.log( "[webview] loading fail, more/less than one video, ie. ", video.length )
      return;
    }
    if ( video[0].readyState < 1 || !video[0].currentTime || video[0].currentTime < 5 ) {
      console.log( "[webview] too early to tell if this is the video, ie. ", video[0].currentTime )
      return;
    }
    if ( video[0].duration < 30 ) {
      console.log( "[webview] video too short to be a film :), ie. ", video[0].duration )
      return;
    }
    handpick.video = video[0];
    handpick.video.onseeked = function(){ handpick.ipcRenderer.sendToHost( "seek" ); }
    handpick.video.ontimeupdate = function() { handpick.get_current_time() };

    var url = window.location.href
    if ( url.indexOf("netflix") != -1 || url.indexOf("amazon") != -1 ) {
      handpick.mode = 3
    } else {
      handpick.mode = 1
    }

    handpick.div = document.createElement("div");
    document.body.appendChild(handpick.div)
  },

  hide_until: function( time ) {
    if( !handpick.isloaded() ) return;
    var video = handpick.video;
    var now   = video.currentTime
    console.log( "[webview] hiding from ",now," to ",time," using mode ", handpick.mode )
    if ( handpick.mode != 3 ) {
      video.currentTime = time
    } else {
      if ( now > time ) {
        handpick.css_show();
      } else {
        var rate = (time-now<1)? 1 : handpick.fast_rate
        handpick.css_hide( rate )
        setTimeout(handpick.hide_until.bind(null,time), handpick.toms(time-now,handpick.fast_rate) ); // call hide_until again after 1/8th, see if we have pass already the time
      }
    }
  },

  mute: function ( state ) {
    if( !handpick.isloaded() ) return;
    handpick.video.muted = state;
  },

  pause: function ( state ) {
    if( !handpick.isloaded() ) return;
    if ( state ) {
      handpick.video.pause();
    } else {
      handpick.video.play();
    }
  },

  go_to_frame: function ( time ) {
    if( !handpick.isloaded() || !time ) return;
    if ( handpick.mode != 3 ) {
      handpick.video.currentTime = time
    }    
  },

  toms : function( time, factor ){
    console.log( "checking again in ", time*1000/factor, "ms" )
    return time*1000/factor
  },

  css_show : function() {
    console.log( "Unhiding player ")
    var video = handpick.video;
    video.playbackRate = 1;
    video.style.visibility = 'visible';
    video.muted = false;
  },

  css_hide : function( rate ) {
    console.log( "Hiding player ", rate )
    var video = handpick.video;
    video.playbackRate = rate;
    video.style.visibility = 'hidden';
    video.muted = true;
  },

  focus_video2 : function() {
  // remove all video elements but ours (to make sure we are controlling the right one)
    var video_list =  document.getElementsByTagName("video")
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

  get_video_rect  : function() {
    var video = handpick.video;
    var video_rect   = video.getBoundingClientRect();
    var video_ratio  = video.videoWidth/video.videoHeight
    var display_ratio= video.offsetWidth/video.offsetHeight
    if ( video_ratio > display_ratio ) {
      var w = video.offsetWidth
      var h = video.offsetWidth/video_ratio
      var t = video_rect.top + (video.offsetHeight-h)/2
      var l = video_rect.left
    } else {
      var w = video.offsetHeight*video_ratio
      var h = video.offsetHeight
      var t = video_rect.top
      var l = video_rect.left + (video.offsetWidth-w)/2
    }
    return {y:Math.round(t),x:Math.round(l),width:Math.round(w),height:Math.round(h)}
  },

  draw_rect : function (h,t,l,w,v) {
    if( !handpick.isloaded() ) return;
    handpick.div.style = "visibility:"+v+"; position: fixed; z-index: 998; top: "+(t-4)+"px; left: "+(l-4)+"px; width: "+w+"px; height: "+h+"px; border: 4px solid #73AD21;"
  },

  isloaded : function () {
    if ( !handpick.video ) {
      handpick.load();
    };
    return (!!handpick.video)
  },

  skip_until : function( time ) {
    if( !handpick.isloaded() ) return;
    var now   = handpick.video.currentTime
    if ( Math.abs( now - time ) < 100 ) return; // ignore ultra short jumps
    handpick.hide_until( time )
  },

  get_rect : function () {
    if( !handpick.isloaded() ) return;
    var r = handpick.get_video_rect();
    var lr= handpick.last_rect;
    if ( !lr || r.width != lr.width || r.height != lr.height || r.x != lr.x || r.y != lr.y) {
      handpick.ipcRenderer.sendToHost( "video_rect", r )
      handpick.last_rect = r
    }
  },

  get_current_time : function () {
    if( !handpick.isloaded() ) return;
    handpick.ipcRenderer.sendToHost( "currentTime", handpick.video.currentTime )
  },

  focus_video : function () {
    if( !handpick.isloaded() ) return;
    handpick.focus_video2();
  }

}

handpick.listen()
