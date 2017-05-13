
/*======================================================================*/
//----------------------------- LIBRARIES ------------------------------//
/*======================================================================*/
const openSub     = require('opensubtitles')
const getFilesize = require('file-bytes')
const httpRequest = require('request');
const storage     = require('node-persist');

storage.init();


/*======================================================================*/
//----------------- EXTERNALLY CALLABLE FUNCTIONS ----------------------//
/*======================================================================*/



/**
 * Add a scene to the scene list
 * @param {number} start where to start skipping (in seconds)
 * @param {number} end where to stop skipping (in seconds)
 * @param {array} tags list of tags
 * @param {string} comment description of the scene
 * @param {string=null} id ...
 * @returns {number} don't know yet
 */
function add_scene ( start, end, tags, comment, id, syncData ) {
  trace( "add_scene", arguments )
  id = id || random_id()

  var scene = {
    id:       id,
    tags:     tags,
    comment:  comment,
    start:    start,
    end:      end,
    syncData: syncData
  }

  var film = get_local_data( "currentFilm" )
  var i    = find_in_array( film.scenes, id );
  // Add scene
  if ( i == -1 ){ film.scenes.push( scene ) }
  // Edit scene
  else{ film.scenes[i] = scene }

  set_local_data( "currentFilm", film )

  return film.scenes
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
 * Get list of scenes
 * @returns {json} json with the list of scenes
 */
function get_scenes ( ) {
  trace( "get_scene", arguments )
  var film = get_local_data( "currentFilm" )
  return film.scenes
}





/**
 * Search film in database
 * @param {string} file Path to file eg. "/home/miguel/films/Homeland.S03E02.mp4"
 * @param {string} url full url where the media is located
 * @param {string} title Film title eg. "The Lord Of The Rings"
 * @param {string} imdbid ID on IMDB eg. tt1234567
 * @returns {json} metadata and scene content of matched film OR list of ids if multiple films match searching criteria
 */
function search_film ( file, title, url, imdbid ) {
  trace( "search_film", arguments )
// We got an id
  if ( imdbid ) {
    var film = get_local_data( imdbid )
    if ( film ) {
      set_local_data( "currentFilm", film )
      Promise.resolve( { status:205, data:film } );
    } else {
      return call_online_api( { action:"search", imdb_code: imdbid } ).then( function ( film ) {
        if ( film["status"] == 200 ) set_local_data( "currentFilm", film["data"] )
        return film;
      })
    }
  };

// We got a file
  if ( file ) {
    return parse_input_file( file ).then( function ( stats ) {
      var imdbid = get_local_data( stats.hash+"|"+stats.filesize )
      if ( imdbid ) {
        var film = get_local_data( imdbid )
        if ( film ) {
          set_local_data( "currentFilm", film )
          return { status:205, data:film };
        };
      };

      return call_online_api( { action:"search", filename:stats.estimated_title, hash:stats.hash, bytesize:stats.filesize, url:url } ).then( function ( film ) {
        if ( film["status"] == 200 && film["data"]["type"] != "list" ){
          console.log( film )
          set_local_data( stats.hash+"|"+stats.filesize, film["data"]["id"]["imdb"] )
          set_local_data( film["data"]["id"]["imdb"], film["data"] )
          set_local_data( "currentFilm", film["data"] )
        }
        console.log(film)
        return film;
      })
    })
  }

// We just got a title/url
  return call_online_api( { action:"search", filename:title, url:url } ).then( function ( film ) {
    if ( film["status"] == 200 ) set_local_data( "currentFilm", film["data"] )
    return film;
  })
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
 * Tells you who you are (this is, your username and permissions)
 * @returns {json} {username:"pepe",permissions:undefined_yet}
 */
function who_am_i ( ) {
  trace( "who_am_i", arguments )
  return { username: get_local_data("username"), permissions: get_local_data("permissions") }
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
  var film  = get_local_data( "currentFilm" ); if (!film) return Promise.reject( "No film is currently open" );
  return call_online_api( { action:"modify", data:film } )
}




/**
 * Assign current user as "agent" of this film
 * @returns {json} API response
 */
function claim ( ) {
  trace( "claim", arguments )
  var film  = get_local_data( "currentFilm" ); if (!film) return Promise.reject( "No film is currently open" );
  return call_online_api( { action:"claim", imdb_code:film["id"]["imdb"] } )
}


function get_settings() {
  var settings = get_local_data( "settings" )
  if ( !settings) settings = defaul_settings;
  return settings;
}

var defaul_settings = {
  username: undefined,
  editors_view_enabled : false,
  players: [
    { name: "Netflix", enabled: true, url:"https://www.netflix.com/watch/#netflix#", alturl:"https://www.netflix.com/search?q=#title#" },
    { name: "Amazon Video",  enabled: true, url:"https://www.amazon.co.uk" },
    { name: "Youtube Movies",  enabled: true, url:"https://www.youtube.com/results?search_query=#title#" },
    { name: "Local File",  enabled: true, url:"file" },
    { name: "DVD",  enabled: false, url:"dvd" }
  ],
  unwanted_tags: []
}


function update_settings( settings ) {
  if ( !settings ) return;
  set_local_data( "settings", settings )
}






// Basic functions
exports.search_film   = search_film;
exports.add_review    = add_review;
exports.get_settings  = get_settings;
exports.update_settings  = update_settings;


// Scene edition
exports.claim         = claim;
exports.add_scene     = add_scene;
exports.get_scenes    = get_scenes;
exports.remove_scene  = remove_scene;
exports.share_scenes  = share_scenes;

// Authentication functions
exports.new_user      = new_user;
exports.new_pass      = new_pass;
exports.log_in        = log_in;
exports.who_am_i      = who_am_i;

/*======================================================================*/
//----------------------- INTERNAL FUNCTIONS ---------------------------//
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




// Call fcinema api, return object
function call_online_api ( params ) {
  trace( "call_online_api", arguments )
// Set authentication token (if available)
  var token = get_local_data( "token" )
  if ( token ) params["token"] = token;
// Create query
  var str = [];
  for( var key in params ) if(params[key]) str.push( key + "=" + params[key] );
  var url = "http://fcinema.org/api?"+str.join("&")
// Reject if query is invalid
  if( str.length == 0 ) return Promise.reject( "Invalid parameters" );
// Return promise with API result
  return new Promise(function(resolve, reject) {
    httpRequest( url, function(error, response, body) {
      if( error ){
        resolve( {status:400} )
      } else {
        var data = JSON.parse( body )
        if( data["token"] )    set_local_data( "token", data["token"] )
        if( data["username"] ) set_local_data( "username", data["username"] )
        if( data["permissions"] ) set_local_data( "permissions", data["permissions"] )
        resolve( data )
      }
    });
  });
}



// Get title from file name
function title_from_filename( str ) {
  var title = str.toString().replace(/\\/g,'/').split("/").pop();
  title = title.replace(/mp4|avi|\[.*\]|\(.*\).*|1080p.*|xvid.*|mkv.*|720p.*|web-dl.*|dvdscr.*|dvdrip.*|brrip.*|bdrip.*|hdrip.*|x264.*|bluray.*|hdtv.*|yify.*|eztv.*|480p.*/gi,'');
  title = title.replace(/\.|_/g,' ').replace(/ +/g,' ').replace(/ +$/,'');
  return title
}


function get_local_data ( id ) {
  trace( "get_local_data", arguments )
  return storage.getItemSync( id )
}

function set_local_data ( id, data ) {
  trace( "set_local_data", arguments )
  storage.setItem( id, data )
}



/*======================================================================*/
//----------------------------- HELP FUNCTIONS -------------------------//
/*======================================================================*/

function find_in_array ( array, id ) {
  for ( var i = 0; i < array.length; i++) {
    if( array[i]["id"] == id ) return i
  };
  return -1;
}

function random_id () {
  var text     = ""
  var possible = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
  for (var i = 0; i < 10; i++) {
    text += possible.charAt( Math.floor( Math.random() * possible.length ));
  };
  return text;
}


var appStartTime;
function trace ( name, args ) {
  if ( !appStartTime) appStartTime = Date.now();
  args = Array.from( args );
  console.log( "[TRACE ",Date.now()-appStartTime,"]",name,args)
}
