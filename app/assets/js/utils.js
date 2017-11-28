/*======================================================================*/
//----------------------------- LIBRARIES ------------------------------//
/*======================================================================*/
const openSub = require('opensubtitles')
const getFilesize = require('file-bytes')
const httpRequest = require('request');
const storage = require('node-persist');

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
function search_film(file, title, url, imdbid) {
    trace("search_film", arguments)
    // We got an id
    if (imdbid) {
        // Check online
        return call_online_api({ action: "search", imdb_code: imdbid }).then(function(film) {
            if (film["status"] == 200) {
                set_local_data(imdbid, film["data"])
                film = merge_local_tags(film);
                console.log("merged local data ", film)
                return film;
            }
            // In case of network error... check if we got a local copy
            film = get_local_data(imdbid)
            if (film["type"]) return merge_local_tags({ status: 205, data: film })
            // If we don't have anything
            return { status: 400, data: {} }
        })

    };

    // We got a file
    if (file) {
        return parse_input_file(file).then(function(stats) {
            // Check if we have identified this file before
            var imdbid = get_local_data(stats.hash + "|" + stats.filesize)
            console.log(imdbid)
            if (imdbid) return search_film(null, null, null, imdbid)
            // If we haven't, ask the network
            return call_online_api({ action: "search", filename: stats.estimated_title, hash: stats.hash, bytesize: stats.filesize, url: url }).then(function(film) {
                if (film["status"] == 200 && film["data"]["type"] != "list") {
                    var imdbid = film["data"]["id"]["imdb"]
                    set_local_data(stats.hash + "|" + stats.filesize, imdbid)
                    set_local_data(imdbid, film["data"])
                }
                return merge_local_tags(film);
            })
        })
    }

    // We just got a title/url
    return call_online_api({ action: "search", filename: title, url: url }).then(function(film) {
        return merge_local_tags(film);
    })
}




/**
 * Add a review to the currently open film
 * @param {json} review Object containing the review
 * @returns {json} API response
 */
function add_review(review) {
    trace("add_review", arguments)
    return call_online_api({ action: "review", review: review })
}




/**
 * Login a user (do it once/or to login a new user, session is kept even if the user closes the App)
 * @param {string} user username eg. "pepe"
 * @param {string} pass old password eg. "idkfiaadsfa"
 * @param {string} newpass new password for this user eg. "tt1234567"
 * @returns {json} API response
 */
function log_in(user, pass) {
    trace("log_in", arguments)
    return call_online_api({ action: "login", username: user, password: pass })
}




/**
 * Tells you who you are (this is, your username and permissions)
 * @returns {json} {username:"pepe",permissions:undefined_yet}
 */
function who_am_i() {
    trace("who_am_i", arguments)
    return { username: get_local_data("username"), permissions: get_local_data("permissions") }
}




/**
 * Create a new user
 * @param {string} user username eg. "pepe"
 * @param {string} pass password eg. "idkfiaadsfa"
 * @returns {json} API response
 */
function new_user(user, pass, email) {
    trace("new_user", arguments)
    return call_online_api({ action: "newuser", username: user, password: pass, email: email })
}




/**
 * Set a new password
 * @param {string} user username eg. "pepe"
 * @param {string} pass old password eg. "idkfiaadsfa"
 * @param {string} newpass new password for this user eg. "1234567"
 * @returns {json} API response
 */
function new_pass(user, pass, newpass) {
    trace("new_pass", arguments)
    return call_online_api({ action: "newpass", username: user, password: pass, newpass: newpass })
}




/**
 * Share local scenes editions with online database (doesn't matter if we are "agents" or normal users)
 * @returns {json} API response
 */
function share_scenes(film) {
    trace("share_scenes", arguments)

    var scenes = []
    for (var i = film.scenes.length - 1; i >= 0; i--) {
        scenes[i] = {}
        scenes[i]['id'] = film.scenes[i]['id']
        scenes[i]['tags'] = film.scenes[i]['tags']
        scenes[i]['comment'] = film.scenes[i]['comment']
        scenes[i]['start'] = film.scenes[i]['start']
        scenes[i]['end'] = film.scenes[i]['end']
    }

    filtered_film = {
        id: film.id,
        scenes: scenes,
        syncRef: film.syncRef
    }

    film = encodeURIComponent(JSON.stringify(filtered_film))

    return call_online_api({ action: "modify", data: film })
}




/**
 * Save scenes editions localy
 * @returns {something}
 */
function save_edition(film, scenes) {
    trace("save_edition", arguments)
    var imdbid = film["id"]["imdb"]
    return set_local_data(imdbid + "_mytags", scenes)
}

/**
 * Save scenes editions localy
 * @returns {something}
 */
function save_sync_ref(imdbid, sync_data5234) {
    trace("save_sync_ref", arguments)
    //if (sync_data.length == 0) return
    var b = JSON.parse(sync_data5234)
    //var imdbid = film[ "id" ][ "imdb" ]
    return set_local_data(imdbid + "_mysync", b )
}


/**
 * Merge "mytags" into "communitytags"
 * @returns {json} with film
 */
function merge_local_tags(film) {
    trace("merge_local_tags", arguments)
    if (film.status == 400 || !film.data["id"] || !film.data["id"]["imdb"]) return film
    var imdbid = film.data["id"]["imdb"]

    var scenes = get_local_data(imdbid + "_mytags")
    if (scenes) {
        film.data.scenes = scenes
    }
    // TODO: this should be smarter
    if (!film.data.syncRef) {
        var syncRef = get_local_data(imdbid + "_mysync")
        console.log("ge got previous syncRef ", syncRef)
        if (syncRef) film.data.syncRef = syncRef
    }


    return film;
}






/**
 * Assign current user as "agent" of this film
 * @returns {json} API response
 */
function claim(imdbid) {
    trace("claim", arguments)
    return call_online_api({ action: "claim", imdb_code: imdbid })
}


function get_settings() {
    var settings = get_local_data("settings")
    if (!settings) settings = defaul_settings;
    return settings;
}

var defaul_settings = {
    language: "ES",
    username: "",
    editors_view: false,
    tags: [
        { 'action': null, 'list': true, 'type': 'Sex', 'name': 'rape' },
        { 'action': null, 'type': 'Sex', 'name': 'pornographic magazine' },
        { 'action': null, 'type': 'Sex', 'name': 'art nudity' },
        { 'action': null, 'type': 'Sex', 'name': 'topless male' },
        { 'action': null, 'type': 'Sex', 'name': 'topless female' },
        { 'action': null, 'type': 'Sex', 'name': 'full nudity male' },
        { 'action': null, 'type': 'Sex', 'name': 'full nudity female' },
        { 'action': null, 'type': 'Sex', 'name': 'explicit sex' },
        { 'action': null, 'type': 'Sex', 'name': 'implied sex' },
        { 'action': null, 'type': 'Sex', 'name': 'kissing peck' },
        { 'action': null, 'type': 'Sex', 'name': 'kissing passionate' },
        { 'action': null, 'type': 'Sex', 'name': 'sexually charged scene' },

        { 'action': null, 'type': 'Violence', 'name': 'punching' },
        { 'action': null, 'type': 'Violence', 'name': 'torture' },
        { 'action': null, 'type': 'Violence', 'name': 'violent accident' },
        { 'action': null, 'type': 'Violence', 'name': 'open wounds' },
        { 'action': null, 'type': 'Violence', 'name': 'killing' },
        { 'action': null, 'type': 'Violence', 'name': 'hand gesture' },
        { 'action': null, 'type': 'Violence', 'name': 'explosion' },
        { 'action': null, 'type': 'Violence', 'name': 'battle' },
        { 'action': null, 'type': 'Violence', 'name': 'agony' },
        { 'action': null, 'type': 'Violence', 'name': 'dead body' },
        { 'action': null, 'type': 'Violence', 'name': 'bulliying' },

        { 'action': null, 'type': 'Others', 'name': 'initial/closing credings' },
        { 'action': null, 'type': 'Others', 'name': 'euphemized profanities' },
        { 'action': null, 'type': 'Others', 'name': 'deity improper use' },
        { 'action': null, 'type': 'Others', 'name': 'deity insult' },
        { 'action': null, 'type': 'Others', 'name': 'alcohol' },
        { 'action': null, 'type': 'Others', 'name': 'smoking' },
        { 'action': null, 'type': 'Others', 'name': 'smoking illegal drug' },
        { 'action': null, 'type': 'Others', 'name': 'drug injection' },
        { 'action': null, 'type': 'Others', 'name': 'frightening/startling scene/event' },
    ]
}


function set_settings(settings) {
    if (!settings) return;
    set_local_data("settings", settings)
}


function link_file_to_film(file, imdbid) {
    trace("link_file_to_film", arguments)
    file = file.replace("file:///", "")
    return parse_input_file(file).then(function(stats) {
        set_local_data(stats.hash + "|" + stats.filesize, imdbid)
    });
}



// Basic functions
exports.search_film = search_film;
exports.add_review = add_review;
exports.get_settings = get_settings;
exports.set_settings = set_settings;
exports.save_edition = save_edition;
exports.save_sync_ref = save_sync_ref;
exports.claim = claim;
exports.share_scenes = share_scenes;
exports.link_file_to_film = link_file_to_film;
exports.merge_local_tags = merge_local_tags

// Authentication functions
exports.new_user = new_user;
exports.new_pass = new_pass;
exports.log_in = log_in;
exports.who_am_i = who_am_i;

/*======================================================================*/
//----------------------- INTERNAL FUNCTIONS ---------------------------//
/*======================================================================*/



// Compute opensubtitles compliant hash and filesize
//https://trac.opensubtitles.org/projects/opensubtitles/wiki/HashSourceCodes
function parse_input_file(input) {
    trace("parse_input_file", arguments)
    return getFilesize(input).then(function(filesize) {
        return new Promise(function(resolve, reject) {
            var oSub = new openSub()
            oSub.computeHash(input, function(err, hash) {
                var title = title_from_filename(input)
                resolve({ hash: hash, filesize: filesize + "", estimated_title: title })
            })
        })
    })
}




// Call fcinema api, return object
function call_online_api(params) {
    trace("call_online_api", arguments)
    // Set authentication token (if available)
    var token = get_local_data("token")
    if (token) params["token"] = token;
    console.log("we got a token ", token)
    // Add region (if available) and version
    var region = get_settings().language
    if (region) params["region"] = region;
    params["version"] = "0.1"; // MODIFY VERSION IN THIS LINE
    // Create query
    var str = [];
    for (var key in params)
        if (params[key]) str.push(key + "=" + params[key]);
    var url = "https://www.fcinema.org/api"; // + str.join( "&" )
    // Reject if query is invalid
    if (str.length == 0) return Promise.reject("Invalid parameters");
    // Return promise with API result
    return new Promise(function(resolve, reject) {
        console.log("requesting: ", url, str.join("&"))

        httpRequest.post({
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            url: url,
            body: str.join("&"),
        }, function(error, response, body) {
            if (error) {
                resolve({ status: 400 })
            } else {
                var reply = JSON.parse(body)
                console.log(reply)
                if (reply.data["token"]) set_local_data("token", reply.data["token"])
                if (reply.data["username"]) set_local_data("username", reply.data["username"])
                if (reply.data["permissions"]) set_local_data("permissions", reply.data["permissions"])
                if (reply.data["update"] == "force") {
                    const { dialog, shell } = require('electron')
                    console.log(dialog.showMessageBox({ "type": "info", "title": "New version available", "message": "We got new exiting features for you!", "buttons": ["Try them"] }, function(argument) {
                        shell.openExternal("www.fcinema.org/updates");
                    }))
                    resolve({ status: 400 })
                }
                resolve(reply)
            }
        });

    });
}



// Get title from file name
function title_from_filename(str) {
    var title = str.toString().replace(/\\/g, '/').split("/").pop();
    title = title.replace(/mp4|avi|\[.*\]|\(.*\).*|1080p.*|xvid.*|mkv.*|720p.*|web-dl.*|dvdscr.*|dvdrip.*|brrip.*|bdrip.*|hdrip.*|x264.*|bluray.*|hdtv.*|yify.*|eztv.*|480p.*/gi, '');
    title = title.replace(/\.|_/g, ' ').replace(/ +/g, ' ').replace(/ +$/, '');
    return title
}


function get_local_data(id) {
    trace("get_local_data", arguments)
    return storage.getItemSync(id)
}

function set_local_data(id, data) {
    trace("set_local_data", arguments)
    storage.setItem(id, data)
}



/*======================================================================*/
//----------------------------- HELP FUNCTIONS -------------------------//
/*======================================================================*/

function find_in_array(array, id) {
    for (var i = 0; i < array.length; i++) {
        if (array[i]["id"] == id) return i
    };
    return -1;
}


var appStartTime;

function trace(name, args) {
    if (!appStartTime) appStartTime = Date.now();
    args = Array.from(args);
    console.log("[TRACE ", Date.now() - appStartTime, "]", name, args)
}