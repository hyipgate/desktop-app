
const {ipcRenderer} = require('electron')

ipcRenderer.on('skip_until', (event,data) => {
  handpick.hide_until( data )
})

ipcRenderer.on('get_rect', () => {
  handpick.ipcRenderer.sendToHost( "video_rect", handpick.get_video_rect() )
})

ipcRenderer.on('get_current_time', () => {
  handpick.ipcRenderer.sendToHost( "currentTime", handpick.video.currentTime )
})

ipcRenderer.on('focus_video', () => {
  handpick.focus_video();
})


window.onload = function () {
  handpick.load()
}



handpick = {

  ipcRenderer: ipcRenderer,

  fast_rate: 8,

  load : function () {
    handpick.video = document.getElementsByTagName("video")[0]
    handpick.video.onseeked = function(){ handpick.ipcRenderer.sendToHost( "seek" ); }
  },

  hide_until: function( time ) {

    var video = handpick.video;
    if ( mode != 3 ) {
      video.currentTime = time // this will automatically call check_status when seeking is finished
    } else {
      var now  = video.currentTime
      console.log( "hide until ",time, " now is", now )
      if ( now > time ) {
        css_show();
      } else {
        var rate = (time-now<1)? 1 : 8
        css_hide( rate )
        setTimeout(handpick.hide_until.bind(null,time), toms(time-now,8) ); // call hide_until again after 1/8th, see if we have pass already the time
      }
    }
  },

  toms : function( time, factor ){
    console.log( "checking again in ", time, factor )
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

  focus_video : function(argument) {
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
    return {t:t,l:l,w:w,h:h}
  }

}