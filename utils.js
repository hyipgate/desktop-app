
/*======================================================================*/
//----------------------------- LIBRARIES ------------------------------//
/*======================================================================*/
const ffmpegPath  = require('@ffmpeg-installer/ffmpeg').path;
const spawn       = require("child_process").spawn;
const tmp         = require('tmp');
const getPixels   = require("get-pixels")
const openSub     = require('opensubtitles')
const getFilesize = require('file-bytes')
const which       = require('which')
const httpRequest = require('request');
const PouchDB     = require('pouchdb');
var localDB       = new PouchDB('localData');




/*======================================================================*/
//----------------- EXTERNALLY CALLABLE FUNCTIONS ----------------------//
/*======================================================================*/

/**
 * Play film
 * @param {string} player the media player we want to use (must be one from the list of available players)
 * @param {json} skip_list list of scenes we want to skip (must have "end" and "start" fields )
 * @param {string} output in case player = "file" the path to put th file
 * @returns {number} don't know yet
 */
function play( player, skip_list, output ){
// Create skip filters
  var vf = create_ffmpeg_filter( "vf", skip_list )
  var af = create_ffmpeg_filter( "af", skip_list )
// Get input file
  var input = get_local_data( "input" )

// Play in ffplayer
  if( player == "ffplay" ){
    var ff = spawn("ffplay",["-i",input,"-vf",vf,"-af",af]);
  }
// Dump to file
  else if ( player == "file" ) {
    var ff = spawn("ffmpeg",["-i",input,"-vf",vf,"-af",af,output]);
  }
// Stream to player
  else {
    var stream = "udp://@127.0.0.1:2000"
    var path   = which.sync( player ) // todo make async
  // Open the media player
    spawn( path,[stream] )
  // Start the video steam
    var ff = spawn("ffmpeg",["-re","-i",input,"-vf",vf,"-af",af,"-q:v",3,"-q:a",3,"-f","mpegts",stream]);
    //ffmpeg -re -i $file -q:v 3 -q:a 3 -f mpegts udp://127.0.0.1:2000
  };
  ff.stderr.on('data', ffmpeg_console_update )
  return 0;
}




/**
 * Preview a scene cut
 * @param {string} start where to start skipping in seconds
 * @param {string} end where to stop skipping in seconds
 * @returns {number} don't know yet
 */
function preview ( start, end ) {
  var input  = get_local_data( "input" )
  var filter = [{start:start,end:end},{start:end+5,end:start-5}]
// Create skip filters
  var vf = create_ffmpeg_filter( "vf", filter )
  var af = create_ffmpeg_filter( "af", filter )

  console.log(input)

// Play in ffplayer
  var ff = spawn("ffplay",["-i",input,"-vf",vf,"-af",af,"-x",300,"-y",220]);
  ff.stderr.on('data', ffmpeg_console_update )
  return 0;
}
var g_currentTime = 0.0;



/**
 * Returns current time (if you are playing something)
 * @returns {number} current time is seconds
 */
function get_current_time (){
  return g_currentTime;
}




/**
 * Find and return the sharpest scene change
 * @param {number} start where to start looking
 * @param {number} end where to stop looking
 * @returns {number} timestamp of the first frame after a sharp scene change
 */
function estimate_scene_change ( start, end ) {
  trace( "estimate_scene_change", arguments )
  return create_sync_data( start, end ).then( function ( sync_data ) {
    var max_distance = 0
    var change_at = -1
    for (var i = 1; i < sync_data.length; i++) {
      var d = hamming_distance( sync_data[i-1][0], sync_data[i][0] )
      if ( d > max_distance ) {
        max_distance = d;
        change_at = sync_data[i][1];
      };
    };
    return change_at;
  })
}




/**
 * Get a list of available players
 * @returns {array} list of available players
 */
function get_players () {
  return new Promise( function (resolve, reject) {
    var possible_players = ["vlc","mplayer","mpv","xbmc","smplayer"];
    var available_players = ["ffplay","file"];

    for (var i = 0; i < possible_players.length; i++) {
      try {
        which.sync( possible_players[i] );  // TODO: this function does not work on MACOS
        available_players.push( possible_players[i] );
      } catch(e){};
    };

    resolve( available_players );
  })
}




/**
 * Syncs scene with the local film version
 * @param {string} id id of the scene we want to presync
 * @returns {number} Promise to a number defining how the sync went
 */
function presync_scene ( id ) {
  trace( "presync_scene", arguments )
  return new Promise( function (resolve, reject) {
    var film = get_local_data( "currentFilm" );   if(  !film  ) return false;
    var i    = find_in_array( film.scenes, id );  if( i == -1 ) return false;
    linear_estimator( film.scenes[i].start ).then( (time) => {
      get_point_offset( time, "start", 5 ).then( (start) => {
        linear_estimator( film.scenes[i].end ).then( (time) => {
          get_point_offset( time, "end", 3 ).then( (end) => {
            resolve( {star:start, end:end } )
          })
        })
      })
    })
  }).catch( (code) => {
    return {start:-1,end:-1}
  })
}




/**
 * Add a scene to the scene list
 * @param {number} start where to start skipping (in seconds)
 * @param {number} end where to stop skipping (in seconds)
 * @param {array} tags list of tags
 * @param {string} comment description of the scene
 * @param {string=null} id ...
 * @returns {number} don't know yet
 */
function add_scene ( start, end, tags, comment, id ) {
  trace( "add_scene", arguments )

  return create_sync_data( start-10, end+10 ).then( function ( data ) {

    var scene = {
      id:       random_id(),
      tags:     tags,
      comment:  comment,
      start:    start,
      end:      end,
      syncData: data
    }

    var film = get_local_data( "currentFilm" )
    var i    = find_in_array( film.scenes, id );
    // Add scene
    if ( i == -1 ) film.scenes.push( scene );
    // Edit scene
    else film.scenes[i] = scene;

    set_local_data( "currentFilm", film )

    return 1
  })
}


/**
 * Remove scene from scene list
 * @param {string} id scene id
 * @returns {number} don't know yet, probably an integer with 0/1 for success/error
 */
function remove_scene ( id ) {
  trace( "remove_scene", arguments )
  var film = get_local_data( "currentFilm" )
  var i    = find_in_array( film.scenes, id )
  if ( i == -1 ) return -1;
  film.scenes[i].splice( i, 1 )
  set_local_data( "currentFilm", film )
  return i
}





/**
 * Search film in database
 * @param {string} file Path to file eg. "/home/miguel/films/Homeland.S03E02.mp4"
 * @param {string} title Film title eg. "The Lord Of The Rings"
 * @param {string} imdbid ID on IMDB eg. tt1234567
 * @returns {json} metadata and scene content of matched film OR list of ids if multiple films match searching criteria
 */
function search ( file, title, imdbid ) {
  trace( "search", arguments )
  if ( !imdbid && file ) {
    return parse_input_file( file ).then( function ( stats ) {
      var imdbid = get_local_data( stats.hash+"|"+stats.filesize )
      if( imdbid ){
        var film = get_local_data( imdbid )
        set_local_data( "currentFilm", film )
        resolve( film );
      } else {
        call_online_api( { action:"search", filename:stats.estimated_title, hash:stats.hash, bytesize:stats.filesize } ).then( function ( film ) {
          if ( film["status"] == 0 ){
            set_local_data( stats.hash+"|"+stats.filesize, film["data"]["id"]["imdb"] )
            set_local_data( film["data"]["id"]["imdb"], film["data"] )
            set_local_data( "currentFilm", film["data"] )
          }
          resolve( film );
        })
      }
    })
  } else {
    return call_online_api( { action:"search", filename:title, imdb_code:imdbid } ).then( function ( film ) {
      if ( film["status"] == 0 ) set_local_data( "currentFilm", film["data"] )
      resolve( film );
    })
  }
}




/**
 * Add a review to the currently open film
 * @param {json} review Object containing the review
 * @returns {json} API response
 */
function add_review ( review ) {
  trace( "add_review", arguments )
  return call_online_api( { action:"review", review:review } )
}




/**
 * Login a user (do it once/or to login a new user, session is kept even if the user closes the App)
 * @param {string} user username eg. "pepe"
 * @param {string} pass old password eg. "idkfiaadsfa"
 * @param {string} newpass new password for this user eg. "tt1234567"
 * @returns {json} API response
 */
function log_in ( user, pass ) {
  trace( "log_in", arguments )
  return call_online_api( { action:"login", username:user, password:pass } )
}




/**
 * Create a new user
 * @param {string} user username eg. "pepe"
 * @param {string} pass password eg. "idkfiaadsfa"
 * @returns {json} API response
 */
function new_user ( user, pass ) {
  trace( "new_user", arguments )
  return call_online_api( { action:"newuser", username:user, password:pass } )
}




/**
 * Set a new password
 * @param {string} user username eg. "pepe"
 * @param {string} pass old password eg. "idkfiaadsfa"
 * @param {string} newpass new password for this user eg. "1234567"
 * @returns {json} API response
 */
function new_pass ( user, pass, newpass ) {
  trace( "new_pass", arguments )
  return call_online_api( { action:"newpass", username:user, password:pass, newpass:newpass } )
}




/**
 * Share local scenes editions with online database (doesn't matter if we are "agents" or normal users)
 * @returns {json} API response
 */
function share_scenes ( ) {
  trace( "share_scenes", arguments )
  var film  = get_local_data( "currentFilm" )
  return call_online_api( { action:"modify", data:film } )
}




/**
 * Assign currently logged it user as "agent" of this film
 * @returns {json} API response
 */
function auto_assign ( ) {
  trace( "auto_assign", arguments )
  var film = get_local_data( "currentFilm" ); if ( !film ) return -1;
  return call_online_api( { action:"claim", imdb_code:film["id"]["imdb"] } )
}


exports.test = test
// Basic functions
exports.search_film   = search;
exports.presync_scene = presync_scene;
exports.get_players   = get_players;
exports.play          = play;
exports.add_review    = add_review;

// Scene editions
exports.auto_assign   = auto_assign;
exports.add_scene     = add_scene;
exports.remove_scene  = remove_scene;
exports.share_scenes  = share_scenes;

// Edition interface
exports.estimate_scene_change     = estimate_scene_change;
exports.preview                   = preview;
exports.get_current_time          = get_current_time;

// Authentication functions
exports.new_user      = new_user;
exports.new_pass      = new_pass;
exports.log_in        = log_in;




/*======================================================================*/
//----------------------------- HELP FUNCTIONS -------------------------//
/*======================================================================*/

// Compute opensubtitles compliant hash and filesize
//https://trac.opensubtitles.org/projects/opensubtitles/wiki/HashSourceCodes
function parse_input_file ( input ){
  trace( "parse_input_file", arguments )
  return getFilesize( input ).then( function ( filesize ) {
    return new Promise( function (resolve, reject) {
      var oSub = new openSub()
      oSub.computeHash( input, function ( err, hash ) {
        var title = title_from_filename( input )
        resolve( { hash:hash, filesize:filesize+"", estimated_title:title })
      })
    })
  })
}


function linear_estimator ( time ) {
  return time;
}


function get_point_offset ( guess, typ, ttl ) {
  trace( "get_point_offset", arguments )
  if ( ttl = 0 ) return -1;
  return create_sync_data( guess-1, guess+1 )
    .then( function ( sync_data ) {
      //console.log( JSON.stringify( sync_data ) )
      var xcorr = crosscorrelate( sync_data ) // TODO: this returns offsets! not absolute positions
      if ( Math.abs(xcorr.center-guess)>1 ) return get_point_offset( xcorr.center, typ, ttl-1 );
      if ( typ == "start" ) return xcorr.min
      if ( typ == "end" )   return xcorr.max
      return xcorr.center
    })
}

// Perform crosscorrelation operation to find a our clip inside a ref clip
function crosscorrelate( our ){
  // TODO: avoid cross-correlating with the whole film (eg. do it by chunks...)
  trace( "crosscorrelate", arguments )
  var ref = get_local_data( "currentFilm" )["syncRef"]
// Set parameters
  var accuracy   = 1/24; // offset values will be rounded to this precision
  var count_min  = 30;   // ignore noisy offsets with few points

// Crosscorrelate
  var d_array = {};
  var d_count = {};
  for (var o = our.length - 1; o >= 0; o--) {
    for (var r = ref.length - 1; r >= 0; r--) {
      if ( !ref[r][1] || !our[o][1] ) continue;
    // Compute time offset and hamming_distance
      var t = ref[r][1] - our[o][1];
      var d = hamming_distance( ref[r][0], our[o][0] )
    // Store value in array
      var i_offset = Math.round ( t / accuracy ) + "";
      if ( d_array[i_offset] == undefined ) {
        d_count[i_offset] = 1;
        d_array[i_offset] = d;
      } else {
        d_count[i_offset] += 1;
        d_array[i_offset] += d;
      }
    };
  };

// Find minimum
  var min_norm_d = 1000;
  var t_min = null;
  for (var t in d_array ) {
    if ( d_count[t] < count_min ) continue
    if ( d_array[t]/d_count[t] > min_norm_d ) continue;
    min_norm_d = d_array[t]/d_count[t];
    t_min = t;
  }

// Find  error interval
  var bef_offset_error = span;
  var aft_offset_error =-span;
  for (var t in d_array ) {
    if ( d_count[t] < count_min/3 ) continue  // Even if it is a noise point, if it has lower distance something might be wrong
    if ( d_array[t]/d_count[t] > 1.5*min_norm_d ) continue;
    if ( bef_offset_error > t ) bef_offset_error = t;
    if ( aft_offset_error < t ) aft_offset_error = t;
  }

// return
  return { min:bef_offset_error*accuracy, center:t_min*accuracy, max:aft_offset_error*accuracy }
}


function get_thumbnails ( start, end, fps, usage ) {
  var input = get_local_data("input")
  trace( "get_thumbnails", arguments )
// Make sure times are reasonable
  if ( start < 0 ) {
    end   += -start
    start = 0
  }
  // TODO: check end is reasonable (but we don't know the length :)

  return new Promise( function (resolve, reject) {
  // Get number of frames
    var nframes = Math.round( (end-start)*fps )
  // Get tmp folder
    var tmpFolder = tmp.dirSync().name;
  // Extract thumbails
    if( usage && usage == "sync"){
      var ff = spawn("ffmpeg",["-ss",start,"-i",input,"-vf","fps="+fps,"-pix_fmt","gray","-s","16x9","-vframes",nframes,tmpFolder+"/thumb%06d.png"])
    } else {
      var ff = spawn("ffmpeg",["-ss",start,"-i",input,"-vf","fps="+fps,"-s","160x90","-vframes",nframes,tmpFolder+"/thumb%06d.png"])
    }
  // Resolve or reject promise based on exit code
    ff.on('close', (code) => {
      if ( code == 0 ) {
        var thumbs = [];
        for (var i = 0; i < nframes; i++) {
          thumbs.push( { time : Math.floor(1000*(start+i/fps)), file : tmpFolder+"/thumb"+pad(i+1,6)+".png" } )
        };
        resolve( thumbs )
      } else{
        console.log( "get_thumbnails failed: ", code )
        reject( code )
      };
    });
  })
}



// Generate thumbnails and return their hash
function create_sync_data ( start, end ) {
  trace( "create_sync_data", arguments )
  return get_thumbnails( start, end, 24, "sync" ).then( function ( thumbs ) {
    return Promise.all( thumbs.map( create_thumbnail_hash ) )
  })
}


// Calculate the hash given a file
function create_thumbnail_hash ( thumb ) {
  return new Promise( function ( resolve, reject ) {
    getPixels( thumb.file, function( err, pixels ) {
      if ( err ) {
        resolve( {} ) // standard would be to "reject", but we are inside a "Promise.all" and missing one point is okay
      } else {
        var base64 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
        var hash   = ""
        var data   = pixels.data; data.push( data[0] )
        for (var i = 4; i < data.length; i+=24) {
          var n = ( data[i-4+0] > data[i+0] ) * 1
          n += ( data[i-4+ 4] > data[i+ 4] ) * 2
          n += ( data[i-4+ 8] > data[i+ 8] ) * 4
          n += ( data[i-4+12] > data[i+12] ) * 8
          n += ( data[i-4+16] > data[i+16] ) * 16
          n += ( data[i-4+20] > data[i+20] ) * 32
          hash += base64.charAt(n)
        };
        resolve( [hash,thumb.time] )
      }
    })
  })
}



// Calculate the hamming distance between two base64 encoded strings
function hamming_distance ( a, b ) {
  var digitsMap = {"0":"000000","1":"000001","2":"000010","3":"000011","4":"000100","5":"000101","6":"000110","7":"000111","8":"001000","9":"001001","A":"001010","B":"001011","C":"001100","D":"001101","E":"001110","F":"001111","G":"010000","H":"010001","I":"010010","J":"010011","K":"010100","L":"010101","M":"010110","N":"010111","O":"011000","P":"011001","Q":"011010","R":"011011","S":"011100","T":"011101","U":"011110","V":"011111","W":"100000","X":"100001","Y":"100010","Z":"100011","a":"100100","b":"100101","c":"100110","d":"100111","e":"101000","f":"101001","g":"101010","h":"101011","i":"101100","j":"101101","k":"101110","l":"101111","m":"110000","n":"110001","o":"110010","p":"110011","q":"110100","r":"110101","s":"110110","t":"110111","u":"111000","v":"111001","w":"111010","x":"111011","y":"111100","z":"111101","+":"111110","-":"111111"}
  var distance  = 0;
  for (var i = 0; i <= 23; i++) {
    if( a.charAt(i) == b.charAt(i) ) continue;
    var ai = digitsMap[ a.charAt(i) ]
    var bi = digitsMap[ b.charAt(i) ]
    for (var j = 5; j >= 0; j--) {
      distance += ( ai.charAt(j) == bi.charAt(j) )
    };
  };
  return distance;
}



// Create a ffmpeg filter
function create_ffmpeg_filter ( stream, times ) {
  /* http://stackoverflow.com/q/39122287/3766869 by Mulvya
    ffplay
      -vf "select='lte(t\,4)+gte(t\,16)',setpts=N/FRAME_RATE/TB"
      -af "aselect='lte(t\,4)+gte(t\,16)',asetpts=N/SR/TB"
      -i INPUT*/
  var filter = [];
  for (var i = 0; i < times.length; i++) {
    filter.push("(lte(t\,"+times[i].start+")"+"+gte(t\,"+times[i].end+"))")
  }
  if ( stream == "vf") {
    return ("fps,select='"+filter.join("*")+"',setpts=N/FRAME_RATE/TB")
  } else if ( stream == "af") {
    return ("aselect='"+filter.join("*")+"',asetpts=N/SR/TB")
  } else {
    return filter.join("*")
  };
}



// Call fcinema api, return object
function call_online_api ( params ) {
  trace( "call_online_api", arguments )
  var url = "http://fcinema.org/api2"

  var token = get_local_data( "token" )
  if ( token ) params["token"] = token;

  var str = [];
  for( var key in params ) if(params[key]) str.push( key + "=" + params[key] );
  if( str.length != 0 ) url = url+"?"+str.join("&") // return null promise rather than calling the API with no params

  return new Promise(function(resolve, reject) {
    httpRequest( url, function(error, response, body) {
      if( error ){
        reject( "Network Error" )
      } else {
        var data = JSON.parse( body )
        if( data["token"] )    set_local_data( "token", data["token"] )
        if( data["username"] ) set_local_data( "user", data["username"] )
        resolve( data )
      }
    });
  });
}


//http://stackoverflow.com/a/10073788/3766869
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}


// Get title from file name
function title_from_filename( str ) {
  var title = str.toString().replace(/\\/g,'/').split("/").pop();
  title = title.replace(/mp4|avi|\[.*\]|\(.*\).*|1080p.*|xvid.*|mkv.*|720p.*|web-dl.*|dvdscr.*|dvdrip.*|brrip.*|bdrip.*|hdrip.*|x264.*|bluray.*|hdtv.*|yify.*|eztv.*|480p.*/gi,'');
  title = title.replace(/\.|_/g,' ').replace(/ +/g,' ').replace(/ +$/,'');
  return title
}


function test (a, b, c, d, e, f, g ) {
  set_local_data( "input", "/home/miguel/videoLab/1/Homeland.S03E02.mp4" )
  preview(25,30)
  /*var default_reference = {"start":60.46,"end":61.085,"data":[["0JEmM28d0r9GD2GZ0eF0w30R",79460],["0JEmM28d0r9GD2GZ0eF0w30R",79501],["0DEGM2ac0r9GD3GZ0eF0w30R",79543],["0D8GI3acWsCe53wZ0eF0w30R",79585],["0B8GQ3acWsCe53wn0eF0w30R",79626],["058GA22ZWwCe63gn0iF0w3WP",79668],["079OB2IZWwEec3un0iF0w3WP",79710],["079892Ip0QEWc1un0iF0u3WP",79751],["W588D2Ip0REmY1yn0aF0v3WP",79793],["W58852on0REGZ2qu0cF0n3WO",79835],["W58852on0PEGZ2qe0MF0n3WO",79876],["WX8853Yn0TAGp2qe0MD0L3WO",79918],["W08e53gn0TAGp2qe06D0n3WO",79960],["W08e42gn0DBOp2+i0sF0n3WO",80001],["W08e42gnWDFOn2Ui0tF0v3WU",80043],["yae39E0W14eO6ADm36y0J2W0",80085],["S4x3XD0m1VgG6Z5mO1860Y1G",80126],["Rqi3PEGi18kO0QOmMCy06A0G",80168],["Rmi3PEGi18kO8QOm6Cu06B0I",80210],["y8j3dF0d12hiWXoma98m43CO",80251],["Pet3qEG+19subvoNaGd1WP0G",80293],["+ad3xF0t1ct8pacP1p4Wn1mO",80335],["+ad3xF0t1ct8pacP1p4Wn1mO",80376],["i4t3yDGx1vtqu8v6mO7Cj16E",80418],["viv3Rkmd1ivCUOd33RGWT4m6",80460],["y0e3EEmZ1+eWDYn3mS0O62C3",80501],["y0e3CEmZ1+eWDYn3mS0O62C3",80543],["S0i36Fmn1Ueq6ouXOE8C32tH",80585],["y0u3GFOi17guXcRep7ivWnC8",80626],["SGu30ECk33fzGYFqv3sSmO64",80668],["SGu30ECc33fzGYFqv3sSmO64",80710],["RMu10E2ZdnePOc7oy1UUmk3M",80751],["CZen8E8nO8e72vX8UWf79x09",80793],["aXuO06Cl04q3XzGiBav3i-WL",80835],["aXuO06Cl04q3XzGiBav3i-W5",80876],["s0zDe2Mq0SKXyQ8c7se1cVmK",80918],["T083Op1RGBJuO6EpXQSe178G",80960],["S0k10vXVGb3CD3ZfmCCi53bG",81001],["S0k10vXVGb3CD3ZfmCCi53bG",81043],["S0+1WjnSOw1J6omci6Boa2cG",81085],["U0s7m1B72R7mXDCWk9eD6YD0",81126],["U0sDm0ZRYy3inXDGzO8d6o44",81168],["U0sDm0ZRYy3inXDGzO8d4o44",81210],["V0pCOWpF7Usmqe6RywCpSQ26",81251],["V0mCM0w34t0S7Wb7i1pCqc3C",81293],["-WuCB0sJuR0tBwud6oHaSI06",81335],["-WuCB0sJuR0tBwuZ6oHaSI06",81376],["-GuR6E+9nF4lnOybJ+OZEAW3",81418]]}
  search( "/home/miguel/videoLab/1/Homeland.S03E02.mp4", undefined, "tt0000000" )/*.then(
  //log_in( "pepe", "pepe" )
  add_scene ( 28.23, 29.53, ["tag1","tag2"], "comment", "idtesting" )).then( console.log( localData ))
  //play ( "ffplay", [{start:3.21,end:10.42},{start:13.21,end:20.42},{start:23.21,end:40.42}], "/home/miguel/videoLab/test.mp4" )
  //preview ( {start:23.21,end:40.42} )
  //get_scene_exact_times ( default_reference.start, default_reference.end, default_reference )
  //*/
}

var appStartTime;
function trace ( name, args ) {
  if ( !appStartTime) appStartTime = Date.now();
  args = Array.from( args );
  console.log( "[TRACE ",Date.now()-appStartTime,"]",name,args)
}



var localData = {}
function get_local_data ( id ) {
  trace( "get_local_data", arguments )
  return localData[id]
}

function set_local_data ( id, data ) {
  trace( "set_local_data", arguments )
  //var id = data["id"]? data["id"]["imdbid"] : alternative_id
  localData[id] = data;
}


function find_in_array ( array, id ) {
  for ( var i = 0; i < array.length; i++) {
    if( array[i]["id"] == id ) return i
  };
  return -1;
}

function random_id () {
  var text      = ""
  var possilble = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
  for (var i = 0; i < 10; i++) {
    text += possilble.charAt( Math.floor( Math.random() * possilble.length ));
  };
  return text;
}


function ffmpeg_console_update ( data ) {
  var timeRegex = /^ +(\d+.\d+)/;
  var matched   = timeRegex.exec( data.toString() )
  if ( matched ) {
    g_currentTime = matched[1]
  } else {
    console.log( data.toString() )
  }
}