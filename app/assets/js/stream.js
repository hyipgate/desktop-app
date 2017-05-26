/* Require libraries */
const {remote} = require('electron')


//************************************************************************//
//                       EXTERNAL FUNCTIONS                               //
//************************************************************************//


function load_film( url, film, edit ) {
  currentUrl  = "https://www.youtube.com/"
  currentFilm = film;
  load_skip_list( film.scenes );
  syncRef = []//currentFilm["syncRef"];
  if ( edit ) {
    start_editing()
  } else {
    watch_film()
  }

}



function preview( start, end ) {
  load_skip_list( [{start:start,end:end}] );
  var u_start = guess_users_time( start )
  hide_until( u_start - 3000 );
  watch_film()
}

/**
 * Watch film in user mode (skipping unwanted frames)
 */
function watch_film() {
  mode = "user";
  initialize_stats()
  if ( timer_id ) clearInterval( timer_id );
  timer_id = setInterval( get_thumbail, 1000 );
}

/**
 * Watch film in editors mode (capturing frames and storing time-hash pairs)
 */
function start_editing(){
  // Listen keyboard events 
  window.onkeyup = function(e) {
     var key = e.keyCode ? e.keyCode : e.which;
     if ( key == 110 ) {
        mark_current_time()
     }
  }

  mode = "editor";
  if ( timer_id ) clearInterval( timer_id );
  timer_id = setInterval( get_thumbail, 80 );
}

/**
 * Stop watching
 */
function end_capture() {
  if ( mode == "editor" ) { syncRef = hash_list;}
  else { print_stats() }
  if ( timer_id ) clearInterval(timer_id);
  timer_id = false;
}


/**
 * Mark current time as the start/end of a scene
 */
function mark_current_time() {
  if ( !s_start ) {
    s_start = nearest_scene_change( video_time(), true )
    webview.executeJavaScript('handpick.mute(true)')
    console.log( "Scene start marked at ", s_start )
  } else {
    var s_end = nearest_scene_change( video_time(), false )
    skip_list.push({start:s_start,end:s_end})
    //add_scene( s_start, s_end, [], "" ) // TODO :)
    s_start = null;
    webview.executeJavaScript('handpick.mute(false)')
    console.log( "Scene added ", s_start," -> ", s_end )
  }
}
var skip_list = []
var s_start = null;



//************************************************************************//
//                         CORE FUNCTIONS                                 //
//************************************************************************//

function load_webview() {
  webview = document.getElementsByTagName('webview')[0]
  if ( !webview ) {
    console.log( "webview not ready yet")
    return
  }
  webview.loadURL( currentUrl ) // TODO: or return false

// Listen to events from player 
  webview.addEventListener('ipc-message', event => {
    if ( event.channel == "video_rect") {
      var r = event.args[0];
      if( r.width == 0 || r.height == 0 ) return;
      orect = r;
      rect  = r;
      improve_rect();
    } else if ( event.channel == "currentTime" ) {
      time = 1000*event.args[0];
      cpu_time = Date.now();
    } else {
      console.log("ipc-message received: ",event.channel)
    }
  })

  return true;
}


/* Define some global variables */
  var historic_sync = { t_bef: -1, t_min:-1, t_aft:-1, c_time:-1, span:5, confidence:0 }
  var rect  = false;
  var orect = false;
  var time  = 0;
  var mode  = "user";
  var timer_id = false;
  var hash_list= {};
  var cpu_time = 0;
  var webview  = false;


/**
 * Listen to events from player
 */
function get_rect() {
  if( webview ){
    //console.log( "try to get rect!")
    webview.executeJavaScript('handpick.get_rect()')  
  } else {
    console.log( "try to load webview!")
    load_webview()
  }  
}



/**
 * Gets the timestamps of the current video
 * @returns {number} current time
 */
function video_time() {
// Check we have some time data
  if ( time == 0 || cpu_time == 0 ) return 0;
// Elapsed time since variable "time" was updated.
  var elapsed_time = (Date.now()-cpu_time);
// Detect if video is paused (as time gets updated at least every 250ms) TODO: Improve this hack
  if ( elapsed_time > 500 ) elapsed_time = 0;
// Return video time
  return Math.floor(time+elapsed_time)
}



/**
 * Improves the quality of the rect (croping black borders)
 */
function improve_rect() {
  console.log("improve rect, don't do this too often")
  remote.getCurrentWindow().capturePage(function handleCapture (img) {
    var bitmap  = img.getBitmap() // TODO: find out why this blocks the video
    var columns = img.getSize().width
    var rows    = img.getSize().height
    var j       = orect.y;
    for ( j = orect.y; j < orect.height+orect.y; j++) {
      var sum = 0;
      for (var i = orect.x; i < orect.width+orect.x-1; i++) {
        var r = bitmap[(j*columns+i)*4]
        var g = bitmap[(j*columns+i)*4+1]
        var b = bitmap[(j*columns+i)*4+2]
        sum+= (r+g+b)+ 10*Math.abs(r-g)+10*Math.abs(b-g)
      }
      console.log(sum / orect.width )
      if ( sum / orect.width > 50 ) break;
    }
    var first = j-1;

    /*for ( j = orect.height+orect.y-1; j > orect.y; j--) {
      var sum = 0;
      for (var i = orect.x; i < orect.width+orect.x-1; i++) {
        var r = bitmap[(j*columns+i)*4]
        var g = bitmap[(j*columns+i)*4+1]
        var b = bitmap[(j*columns+i)*4+2]
        sum+= (r+g+b)+ 10*Math.abs(r-g)+10*Math.abs(b-g)
      }
      console.log(sum / orect.width)
      if ( sum / orect.width > 50*1.5 ) break;
    }
    var last = j+1*/
    var last = orect.height-first // do it symmetric
    var usual_ratios = [1.33,1.77,1.85,2.39]
    var our = orect.width/(last-first)
    var dmin = Infinity; var amin = 0;
    for (var i = 0; i < usual_ratios.length; i++) {
      var d = Math.abs(usual_ratios[i]-our)
      if ( d < dmin ) {
        dmin = d;
        amin = i;
      }
    }

    console.log(usual_ratios[amin],our)
    var crop = orect.height - orect.width/usual_ratios[amin];
    rect.y = Math.round(orect.y+crop/2);
    rect.height = Math.round(Math.min(orect.height,orect.width/usual_ratios[amin]));
  })
}




/**
 * Capture current frame, generate hash and skip/watch/store accordingly
 */
function get_thumbail ( ) {
  get_rect()
  if ( !rect ) return;
  cb("start")
  var bef_time = video_time();
  remote.getCurrentWindow().capturePage(function handleCapture (img) {
    var aft_time = video_time()
    if ( bef_time > aft_time || aft_time > 50 + bef_time ) {
      console.log("DISCARDING FRAME. Unsure about time of captured frame. Uncertainty  ",Math.floor((aft_time-bef_time)))
      return;
    }
    img = img.crop(rect).resize( { width:16, height:9, quality: "good" } ) // TODO check performance/improvement when using better resize quality
    var hash = bitmap_to_hash( img.getBitmap() )
    if( mode == "editor" ){
      add_to_ref_list( hash, (bef_time+aft_time)/2 )
    } else {
      want_to_see( hash, (bef_time+aft_time)/2 )
    }
  })
}




/**
 * add the hash-time pair to the ref list
 * @param {c_hash} hash hash from current editors video
 * @param {c_time} time time in current editors video timing of the hash parameter
 * @returns {null}
 */
function add_to_ref_list(c_hash,c_time) {
  var block = Math.floor(c_time/1000) // block = seconds
  if ( !hash_list[block] ) hash_list[block] = []
  var ms    = Math.round(c_time-(block)*1000)
  hash_list[block].push([c_hash,ms])
  //console.log( hash, block, ms )
}


function load_skip_list( scenes ) { // TODO: check this actually merge ovelaping scenes. Remove duplicates...
  for (var i = 0; i < scenes.length; i++) {
    for (var j = 0; j < scenes.length; j++) {
      if ( scenes[i].start < scenes[j].start && scenes[j].start < scenes[i].end ) {
        scenes[i].end = Math.max( scenes[i].end, scenes[j].end )
      }
    }
  }
  skip_list = scenes;
}


/**
 * Given a hash-time pair from the users video, decides wheter to watch it or to skip it
 * @param {string} hash hash from current users video
 * @param {number} time time of the hash parameter
 * @returns {json} { min: earliest possible point, center: most probable time, max: latest possible time}
 */
function want_to_see ( hash, time ) {

// Find next scene
  var ref_times  = find_time_in_reference( hash, time );
  var next_start = Infinity
  var next_end   = Infinity
  for (var i = 0; i < skip_list.length; i++) {
    var time_to_end   = skip_list[i].end - ref_times.t_bef
    var time_to_start = skip_list[i].start - ref_times.t_aft
  // Update times if scene is in the future, and the nearest one
    if ( time_to_end > 0 && time_to_start < next_start ) {
      next_start = time_to_start
      next_end   = time_to_end
    }
  };

  if ( next_start < 60 ) {
    cb("Oops, we are ",-next_start,"ms in the middle of a scene. ")
    hide_until( next_end + video_time() )
  } else if ( next_start < 300 ) {
    cb("Scene almost here, wait ",next_start,"ms and skip: ")
    setTimeout( function(){ hide_until( next_end + video_time() ) }, next_start )
  } else if ( next_start < 4000 ){
    cb("Scene is close (",next_start,"ms) check again a bit later: ")
    setTimeout( get_thumbail, 800 )
  }
}





/* *
 * Locates the specified time in the reference film.
 * @param {number} our_time the time point (in our current version) that we want to find in the original film
 * @returns {json} { min: earliest possible point, center: most probable time, max: latest possible time}
 */
function guess_ref_time(c_time) {
  return (historic_sync.t_min-historic_sync.c_time+c_time)
}

/**
 * Try to guess the specified time in the users film.
 * @param {number} r_time a timestamp point (in our current version) that we want to find in the original film
 * @returns {json} { min: earliest possible point, center: most probable time, max: latest possible time}
 */
function guess_users_time(r_time) {
  return (historic_sync.c_time-historic_sync.t_min+r_time)
}




/* *
 * Locates the specified time in the reference film.
 * @param {string} c_hash hash of the frame we want to find
 * @param {number} c_time time (users) of the frame we want to find (to speed up a bit the search...)
 * @returns {json} { min: earliest possible point, center: most probable time, max: latest possible time}
 */
function find_time_in_reference( c_hash, c_time ){

// Check we have the data we need
  if( !c_hash || !c_time ) return;

// Prepare data
  var guessed_time  = guess_ref_time( c_time );
  var guessed_block = Math.floor( guessed_time/1000 );
  console.log(guessed_block)
  var span = historic_sync.span;

// Compare user's frame with reference's frames in "span" blocks around the "guessed_time"
  var d_arr = {};
  var d_min = Infinity;
  var t_min = null;
  var n_blocks = 0;
  for (var block = guessed_block-span; block <= guessed_block+span; block++){
    var ref_data = syncRef[block+""]; if( !ref_data ) continue;
    n_blocks++;
    for (var r = 0; r < ref_data.length; r++) {
    // Calculate how different the frames are
      var d = hamming_distance( ref_data[r][0], c_hash )
      var t = ref_data[r][1]+block*1000
    // Update best matching point
      if ( d < d_min ) {
        t_min = t;
        d_min = d;
      }
    // Store value in array
      d_arr[t] = d;
    }
  }

// Find error interval and try pick the best "t_min"
  var d_min2= Infinity;
  var t_bef = Infinity;
  var t_aft =-Infinity;
  var th    = d_min*1.3;
  for (var t_str in d_arr ) {
    var t = parseInt(t_str)
  // Find error interval
    if ( d_arr[t_str] <= th ){
      if ( t_bef > t ) t_bef = t;
      if ( t_aft < t ) t_aft = t;
    }
  // If we got multiple frames with distance d_min, pick the one that is more consistent with historic data
    if ( d_arr[t_str] < d_min + 1 ){
      var d2 = Math.abs( guessed_time - t );
      if ( d2 < d_min2 ) {
        t_min  = t;
        d_min2 = d2;
      }
    }
  }

// Detect/guess/bet wheter we have an error or not
  var error_detected = ( d_min > 40 || Math.abs(t_aft-t_bef) > 400 || n_blocks < 5 || !syncRef[guessed_block+""] )

// Some stats (useful when we knew the time offset in advance and want to check the sync accuracy)
  var error_th = 150; // Error threshold for stats only
  var offset   = 0;   // Known offset
  total++
  if( Math.abs(c_time-t_min+offset) > error_th ){
    error++
    if ( !error_detected ) false_negative++;
  } else {
    if (  error_detected ) false_positive++;
  }
  console.log(historic_sync,c_time-t_min+offset)


// Make history :)
  if ( !error_detected) {
    span = Math.max(historic_sync.span-10,5);
  } else {
    console.log("DETECTED AN ERROR ",d_min,t_min,t_bef,t_aft,n_blocks,c_time,d_arr)
    var elapsed_time = c_time - historic_sync.c_time;
    t_bef = historic_sync.t_bef + elapsed_time;
    t_aft = historic_sync.t_aft + elapsed_time;
    t_min = historic_sync.t_min + elapsed_time;
    span  = Math.min(historic_sync.span+10,300);
  }
  historic_sync = { t_bef:t_bef, t_min:t_min, t_aft:t_aft, c_time:c_time, span:Math.round(span)};

// More stats after corrections
  abs_error += Math.abs(c_time-t_min+offset)
  if( Math.abs(c_time-t_min+offset) > error_th ) real_error++;

// Return
  return historic_sync;

}


/**
 * Find and return the sharpest scene change
 * @param {number} start wheter it's the start or the end of the scene
 * @param {number} t_pressed time the mark scene button was pressed
 * @returns {number} timestamp of the first frame after a sharp scene change
 */
function nearest_scene_change ( t_pressed, start ) {
  var max_distance = 0;
  var change_at    =-1;
  var span         = start? 2000:1000
  var previous_hash=false
  for (var block = Math.floor((t_pressed-span)/1000); block <= Math.floor(t_pressed/1000); block++){
    var ref_data = hash_list[block+""]; if( !ref_data ) continue;
    for (var i = 1; i < ref_data.length; i++) {
      var t = ref_data[i][1]+block*1000
      if ( t < t_pressed-span || t > t_pressed ) continue;
      if ( previous_hash ) {
        var d = hamming_distance( ref_data[i][0], previous_hash );
        var dev = ((t_pressed-t)-span/2)/750
        console.log(t," -> ",d," -> ",d-dev*dev)
        d = d-dev*dev
        if ( d > max_distance ) {
          max_distance = d;
          change_at = t-(120*start)
        };
      }
      previous_hash = ref_data[i][0]
    };
  };
  console.log("Pressed at: ",t_pressed," scene change at: ",change_at)
  return change_at;
}




//************************************************************************//
//                        HELPER FUNCTIONS                                //
//************************************************************************//

function hide_until( time ) {
  console.log("hide until ", time)
  webview.executeJavaScript('handpick.hide_until('+time/1000+')')  // TODO: this is the definition of unsecure!
}


/**
 * Calculate the hamming distance between two base64 encoded strings
 * @param {string} a hash one
 * @param {string} b hash two
 * @returns {number} hamming distance between hashes
 */
function hamming_distance ( a, b ) {
  var digitsMap = {"0":"000000","1":"000001","2":"000010","3":"000011","4":"000100","5":"000101","6":"000110","7":"000111","8":"001000","9":"001001","A":"001010","B":"001011","C":"001100","D":"001101","E":"001110","F":"001111","G":"010000","H":"010001","I":"010010","J":"010011","K":"010100","L":"010101","M":"010110","N":"010111","O":"011000","P":"011001","Q":"011010","R":"011011","S":"011100","T":"011101","U":"011110","V":"011111","W":"100000","X":"100001","Y":"100010","Z":"100011","a":"100100","b":"100101","c":"100110","d":"100111","e":"101000","f":"101001","g":"101010","h":"101011","i":"101100","j":"101101","k":"101110","l":"101111","m":"110000","n":"110001","o":"110010","p":"110011","q":"110100","r":"110101","s":"110110","t":"110111","u":"111000","v":"111001","w":"111010","x":"111011","y":"111100","z":"111101","+":"111110","-":"111111"}
  var distance  = 0;
  for (var i = 0; i < a.length-1; i++) {
    if( a.charAt(i) == b.charAt(i) ) continue;
    var ai = digitsMap[ a.charAt(i) ]
    var bi = digitsMap[ b.charAt(i) ]
    for (var j = 0; j < 6; j++) {
      distance += ( ai.charAt(j) == bi.charAt(j) )
    };
  };
  return distance;
}


/**
 * Generates a hash from an image in bitmap format
 * @param {string} data bitmap containing the image we want the hash from
 * @returns {string} String containing the hash
 */
function bitmap_to_hash ( data ) {
  var base64 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
  var hash   = ""
  for (var i = 4; i < data.length-20; i+=24) {
    var n = ( data[i-4] > data[i] ) * 1
    n += ( data[i-4+ 4] > data[i+ 4] ) * 2
    n += ( data[i-4+ 8] > data[i+ 8] ) * 4
    n += ( data[i-4+12] > data[i+12] ) * 8
    n += ( data[i-4+16] > data[i+16] ) * 16
    n += ( data[i-4+20] > data[i+20] ) * 32
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
  console.log(false_negative,false_positive,total,error,real_error)
}


function initialize_stats() {
  false_positive = 0
  false_negative = 0
  total = 0
  error = 0
  real_error = 0
  abs_error = 0;
}


// Check we don't have weird things
function purge() {
  for (var i = 200; i >= 0; i--) {
    if ( !syncRef[i] ) continue;
    var block = syncRef[i]
    var last_h = ""
    var last_t = -5;
    for (var j = block.length - 1; j >= 0; j--) {
      if (block[j][1] == last_t && block[j][0] != last_h ) {
        console.log("disssarter! at ",i,j)
        syncRef[i] = null
      }
      last_t = block[j][1]
      last_h = block[j][0]
    }
  }
}



// Draw a rectangle around the rect (to check it has been detected properly)
function draw( v ) {
  webview.executeJavaScript("handpick.draw_rect("+rect.height+","+rect.y+","+rect.x+","+rect.width+",'"+v+"')")
}



// Print timings on console
function cb ( what ) {
  if( what == "start"){
    startScreenshoting = Date.now()
  } else {
    //console.log( what,": ",Date.now() -startScreenshoting)
  }
}
var startScreenshoting;