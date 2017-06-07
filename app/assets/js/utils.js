
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
  // Check online
    return call_online_api( { action:"search", imdb_code: imdbid } ).then( function ( film ) {
      if ( film["status"] == 200 ){
        set_local_data( imdbid, film["data"] )
        return merge_local_tags( film );
      }
    // In case of network error... check if we got a local copy
      film = get_local_data( imdbid )
      if ( film["status"] == 200 ) return  merge_local_tags( { status:205, data:film } )
    // If we don't have anything
      return { status:400, data:{} }
    })
    
  };

// We got a file
  if ( file ) {
    return parse_input_file( file ).then( function ( stats ) {
    // Check if we have identified this file before
      var imdbid = get_local_data( stats.hash+"|"+stats.filesize )
      if ( imdbid ) return search_film( null, null, null, imdbid )
    // If we haven't, ask the network
      return call_online_api( { action:"search", filename:stats.estimated_title, hash:stats.hash, bytesize:stats.filesize, url:url } ).then( function ( film ) {
        if ( film["status"] == 200 && film["data"]["type"] != "list" ){
          var imdbid = film["data"]["id"]["imdb"]
          set_local_data( stats.hash+"|"+stats.filesize, imdbid )
          set_local_data( imdbid, film["data"] )
        }
        return merge_local_tags( film );
      })
    })
  }

// We just got a title/url
  return call_online_api( { action:"search", filename:title, url:url } ).then( function ( film ) {
    return merge_local_tags( film );
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
function share_scenes ( film ) {
  trace( "share_scenes", arguments )
  film = encodeURIComponent(JSON.stringify(film))
  return call_online_api( { action:"modify", data:film } )
}




/**
 * Save scenes editions localy
 * @returns {something}
 */
function save_edition ( film, scenes ) {
  trace( "save_edition", arguments )
  var imdbid = film["id"]["imdb"]
  return set_local_data( imdbid+"_mytags", scenes )
}


/**
 * Merge "mytags" into "communitytags"
 * @returns {json} with film
 */
function merge_local_tags ( film ) {
  trace( "merge_local_tags", arguments )
  if ( film.status == 400 || !film.data["id"] || !film.data["id"]["imdb"] ) return film
  var imdbid = film.data["id"]["imdb"]
  var scenes = get_local_data( imdbid+"_mytags" )
  if ( scenes ) {
    film.data.scenes = scenes
  }
  return film;
}






/**
 * Assign current user as "agent" of this film
 * @returns {json} API response
 */
function claim ( imdbid ) {
  trace( "claim", arguments )
  return call_online_api( { action:"claim", imdb_code:imdbid } )
}


function get_settings() {
  var settings = get_local_data( "settings" )
  if ( !settings ) settings = defaul_settings;
  return settings;
}

var defaul_settings = {
  username: undefined,
  editors_view : false,
  players: [
    { name: "Netflix", enabled: true, url:"https://www.netflix.com/watch/#netflix#", alturl:"https://www.netflix.com/search?q=#title#" },
    { name: "Amazon Video",  enabled: true, url:"https://www.amazon.co.uk" },
    { name: "Youtube Movies",  enabled: true, url:"https://www.youtube.com/results?search_query=#title#" },
    { name: "Local File",  enabled: true, url:"file" },
    { name: "DVD",  enabled: false, url:"dvd" }
  ],
  unwanted_tags: []
}


function set_settings( settings ) {
  if ( !settings ) return;
  set_local_data( "settings", settings )
}






// Basic functions
exports.search_film   = search_film;
exports.add_review    = add_review;
exports.get_settings  = get_settings;
exports.set_settings  = set_settings;
exports.save_edition  = save_edition;
exports.claim         = claim;
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


var appStartTime;
function trace ( name, args ) {
  if ( !appStartTime) appStartTime = Date.now();
  args = Array.from( args );
  console.log( "[TRACE ",Date.now()-appStartTime,"]",name,args)
}
