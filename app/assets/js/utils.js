/*======================================================================*/
//----------------------------- LIBRARIES ------------------------------//
/*======================================================================*/
const openSub = require('opensubtitles')
const getFilesize = require('file-bytes')
const httpRequest = require('request');
const storage = require('node-persist');
const ffmpeg = require('fluent-ffmpeg');
const { remote, ipcRenderer } = require('electron');
const fs = require('fs');


storage.init();

/*======================================================================*/
//----------------- EXTERNALLY CALLABLE FUNCTIONS ----------------------//
/*======================================================================*/




/**
 * Search film in database
 * @param {string} file Path to file eg. "/home/miguel/films/Homeland.S03E02.mp4"
 * @param {string} url full url where the media is located
 * @param {string} title Film title eg. "The Lord Of The Rings"
 * @param {string} film_id ID on IMDB eg. tt1234567
 * @returns {json} metadata and scene content of matched film OR list of ids if multiple films match searching criteria
 */
function search_film(file, title, url, film_id) {
    trace("search_film", arguments)
    // We got an id
    if (film_id) {
        // Check online
        return call_online_api({ action: "search", film_id: film_id }).then(function(film) {
            if (film["status"] == 200) {
                set_local_data(film_id, film["data"])
                return merge_local_data(film);
            }
            // In case of network error... check if we got a local copy
            film = get_local_data(film_id)
            if (film && film["type"]) return merge_local_data({ status: 205, data: film })
            // If we don't have anything
            return { status: 400, data: {} }
        })

    };

    // We got a file
    if (file) {
        return parse_input_file(file).then(function(stats) {
            // Check if we have identified this file before
            var film_id = get_local_data(stats.hash + "|" + stats.filesize)
            console.log(film_id)
            if (film_id) return search_film(null, null, null, film_id)
            // If we haven't identified this file before, ask the network
            return call_online_api({ action: "search", filename: stats.estimated_title, hash: stats.hash, bytesize: stats.filesize, url: url }).then(function(film) {
                if (film["status"] == 200 && film["data"]["type"] != "list") {
                    var film_id = film["data"]["id"]["tmdb"]
                    set_local_data(stats.hash + "|" + stats.filesize, film_id)
                    set_local_data(film_id, film["data"])
                }
                return merge_local_data(film);
            })
        })
    }

    // We just got a title/url
    return call_online_api({ action: "search", filename: title, url: url }).then(function(film) {
        return merge_local_data(film);
    })
}


function add_review(review) {
    trace("add_review", arguments)
    return call_online_api({ action: "review", review: review })
}


function send_feedback(feedback, help) {
    trace("feedback", arguments)
    return call_online_api({ action: "feedback", feedback: feedback, help: help })
}


function log_in(user, pass) {
    trace("log_in", arguments)
    return call_online_api({ action: "login", username: user, password: pass })
}

function log_out() {
    trace("log_out", arguments)
    return call_online_api({ action: "logout" })
}


function who_am_i() {
    trace("who_am_i", arguments)
    return { username: get_local_data("username"), permissions: get_local_data("permissions") }
}


function new_user(user, pass, email) {
    trace("new_user", arguments)
    return call_online_api({ action: "newuser", username: user, password: pass, email: email })
}


function new_pass(user, pass, newpass) {
    trace("new_pass", arguments)
    return call_online_api({ action: "newpass", username: user, password: pass, newpass: newpass })
}

function compare_scenes(a, b) {
    if (a.comment != b.comment) return false
    if (a.start != b.start) return false
    if (a.end != b.end) return false
    if (a.tags.join() != b.tags.join()) return false
    return true
}

function copy_scene(old, new_scene) {
    if (!new_scene) new_scene = {}
    var good = ['id', 'tags', 'comment', 'start', 'end', 'src', 'edited']
    for (var i = 0; i < good.length; i++) {
        new_scene[good[i]] = old[good[i]]
    }
    return new_scene
}


function share_scene(scene, film_id) {
    trace("share_scene", arguments) // actions "add|remove|edit"
    var action = scene.removed ? "remove" : "edit";
    return call_online_api({ action: action, data: JSON.stringify(scene), film_id: film_id })
}


function update_tagged(tagStatus, film_id) {
    trace("update_tagged", arguments)

    var tagged = []
    for (var i = 0; i < tagStatus.length; i++) {
        if (tagStatus[i].done) tagged.push(tagStatus[i].name)
    }
    return call_online_api({ action: "settagged", data: JSON.stringify(tagged), film_id: film_id })
}

function share_sync_ref(syncRef, film_id) {
    trace("share_sync_ref", arguments)
    return call_online_api({ action: "setsync", data: syncRef, film_id: film_id })
}

function get_sync_ref(film_id) {
    trace("get_sync_ref", arguments)
    return call_online_api({ action: "getsync", film_id: film_id })
}



/**
 * Save scenes editions localy
 * @returns {something}
 */
function save_edition(film_id, data) {
    trace("save_edition", arguments)
    var scene = copy_scene(data)
    scene.removed = !!data.removed
    var scenes = get_local_data(film_id + "_myedits") || []
    var index = find_key_by_id(scenes, scene.id)
    if (index == -1) {
        scenes.push(scene)
    } else {
        scenes[index] = scene
    }
    return set_local_data(film_id + "_myedits", scenes)
}

/**
 * Save scenes editions localy
 * @returns {something}
 */
function save_sync_ref(film_id, sync_data) {
    trace("save_sync_ref", arguments)

    share_sync_ref(sync_data, film_id)

    var sync_data = JSON.parse(sync_data)

    var syncRef = get_local_data(film_id + "_mysync")

    console.log("save_sync_ref readed ", syncRef)
    if (!syncRef) syncRef = {}
    if (syncRef.src) syncRef = {} // to clean old versions stuff
    console.log("save_sync_ref merged", merge_sync_data(syncRef[sync_data.src], sync_data))
    syncRef[sync_data.src] = merge_sync_data(syncRef[sync_data.src], sync_data)

    console.log("save_sync_ref ", syncRef)

    return set_local_data(film_id + "_mysync", syncRef)
}


function find_key_by_id(list, id) {
    for (var i = 0; i < list.length; i++) {
        if (list[i].id == id) return i
    }
    return -1;
}

// Add local data (eg. extra tagged scenes...) to the globally shared data
function merge_local_data(film) {
    trace("merge_local_data", arguments)
    if (film.status == 400 || !film.data["id"] || !film.data["id"]["tmdb"]) return film

    var film_id = film.data["id"]["tmdb"]

    // Add local edits
    var scenes = get_local_data(film_id + "_myedits") || []
    for (var i = 0; i < scenes.length; i++) {
        var index = find_key_by_id(film.data.scenes, scenes[i].id)
        if (index == -1) { // local scene is mising on master
            if (scenes[i].removed) continue;
            scenes[i].local = true
            film.data.scenes.push(scenes[i])
        } else { // local scene is also on master
            var same = compare_scenes(film.data.scenes[index], scenes[i])
            if (scenes[i].removed) {
                film.data.scenes[index].removed = true
                film.data.scenes[index].local = true
                film.data.scenes[index].edited = scenes[i].edited
            } else if (!same) {
                var online = copy_scene(film.data.scenes[index])
                film.data.scenes[index].suggestions.push(online)
                copy_scene(scenes[i], film.data.scenes[index])
                film.data.scenes[index].local = true
                film.data.scenes[index].edited = scenes[i].edited
            } // else local version is same as master
        }
    }

    /*film.data.online_scenes = film.data.scenes

    for (var i = 0; i < scenes.length; i++) {
        scenes[i].diffTag = get_diff_tag(scenes[i], film.data.online_scenes)
        //scenes[i].edited = edited(scenes[i], film.data.online_scenes)
    }
    film.data.scenes = scenes*/

    // Add local sync data
    var syncRef = get_local_data(film_id + "_mysync")
    if (syncRef) {
        console.log("we got previous sync data")
        for (var src in syncRef) {
            film.data.syncRef[src] = merge_sync_data(film.data.syncRef[src], syncRef[src])
        }
    }

    var tags = default_settings.tags;
    film.data.needstag = []
    var tagStatus = []
    for (var i = 0; i < tags.length; i++) {
        var done = null
        if (film.data.tagged.indexOf(tags[i].name) != -1) done = true
        if (film.data.needstag.indexOf(tags[i].name) != -1) done = false
        tagStatus[i] = { name: tags[i].name, done: done, long: tags[i].long }
    }
    film.data.tagStatus = tagStatus


    return film;
}

// Merge sync data 'a' and 'b'
function merge_sync_data(a, b) {
    // If one of the datasets is missing, return the other (or {})
    if (!a & !b) return {}
    if (!a) return b
    if (!b) return a

    // If we have both datasets, return the longest (// TODO, merge things properly)
    if (Object.keys(a).length > Object.keys(b).length) {
        return a
    } else{
        return b
    }


}

function get_diff_tag(scene, online) {
    for (var i = 0; i < online.length; i++) {
        if (online[i].id == scene.id) {
            return compare_arrays(scene.tags, online[i].tags)
        }
    }
    return compare_arrays(scene.tags, [])
}

//https://stackoverflow.com/a/1723783/3766869
function compare_arrays(a, b) {
    if (!a) a = [];
    if (!b) b = [];
    // create arrays
    var added = []
    var same = []
    var removed = []
    // Get hash to speed up lookup
    var hash = {};
    for (var i = 0; i < b.length; i++) hash[b[i]] = true;
    // Iterate over array
    for (var i = 0; i < a.length; i++) {
        var value = a[i]
        if (hash[value]) {
            same.push(value)
        } else {
            added.push(value);
        }
        hash[value] = false
    }
    // left values
    for (const value in hash) {
        if (hash[value] && hash.hasOwnProperty(value)) {
            removed.push(value)
        }
    }
    // return
    return { added: added, same: same, removed: removed }
}



function get_settings() {
    var settings = get_local_data("settings")
    if (!settings) settings = default_settings;
    if (!settings.tags[0].long) settings.tags = default_settings.tags
    if (!settings.blur_level) settings.blur_level = 40
    return settings;
}

var default_settings = {
    language: "auto",
    username: "",
    default_providers: "",
    blur_level: 40,
    tags: [
        { 'action': null, 'name': 'Sexual harrasement', 'long': 'Lack of informed approval or freely given agreement; bullying, coercion or unwelcome sexual advances https://en.wikipedia.org/wiki/Sexual_harassment' },
        { 'action': null, 'name': 'Sexual objectification', 'long': 'A person is viewed primarily as an object of sexual desire, with no interest on her/his interest or wellbeing. https://en.wikipedia.org/wiki/Sexual_objectification' },
        { 'action': null, 'name': 'Erotic nudity', 'long': 'Private parts or underwear shown in a provocative manner' },
        { 'action': null, 'name': 'Non-erotic nudity', 'long': '' },
        { 'action': null, 'name': 'Explicit Sex', 'long': '' },
        { 'action': null, 'name': 'Passionate kissing', 'long': '' },
        { 'action': null, 'name': 'Implied Sex', 'long': '' },
        { 'action': null, 'name': 'Sexual Talk', 'long': 'Sexually focused talk' },

        { 'action': null, 'name': 'Discrimination', 'long': 'Unjust or prejudicial treatment on the grounds of race, age, sex, religion...  https://en.wikipedia.org/wiki/Discrimination' },
        { 'action': null, 'name': 'Credits', 'long': 'Closing/opening credits' },
        { 'action': null, 'name': 'Profanity', 'long': '' },
        { 'action': null, 'name': 'Blasphemy', 'long': 'The action or offence of speaking sacrilegiously about God or sacred things' },
        { 'action': null, 'name': 'Ilegal drugs', 'long': '' },
        { 'action': null, 'name': 'Tobacco/Alcohol', 'long': '' },

        { 'action': null, 'name': 'Frightening Scene', 'long': '' },
        { 'action': null, 'name': 'Graphic Violence', 'long': '' },
        { 'action': null, 'name': 'Torture/Agony', 'long': '' },
        { 'action': null, 'name': 'Death', 'long': '' },
    ]
}


function set_settings(settings) {
    if (!settings) return;
    set_local_data("settings", settings)
}


function link_file_to_film(file, film_id) {
    trace("link_file_to_film", arguments)
    file = file.replace("file:///", "")
    return parse_input_file(file).then(function(stats) {
        set_local_data(stats.hash + "|" + stats.filesize, film_id)
    });
}

function checkConversion(inputFile) {
    var needsConversion = {};

    return new Promise(function(resolve, reject) {

        needsConversion.audio = true;
        needsConversion.video = true;

        ffmpeg.ffprobe(inputFile, function(err, metadata) {
            metadata.streams.map(function(codec) {
                if (codec.codec_type === 'audio' && (codec.codec_name == 'aac' || codec.codec_name == 'mp3')) {
                    needsConversion.audio = false;
                } else if (codec.codec_type === 'video' && codec.codec_name == 'h264') {
                    needsConversion.video = false;
                }
            });
            resolve(needsConversion);
        });

    });
}

function convertFile(inputFile, needsConversion) {
    global.gVar = {
        conversionFinished: false,
        conversionProgress: 0.00,
    };
    return new Promise(function(resolve, reject) {
        let convertCommand, cpVideoCodec = 'libx264',
            cpAudioCodec = 'aac';

        if (needsConversion.audio === false) {
            cpAudioCodec = 'copy';
        }
        if (needsConversion.video === false) {
            cpVideoCodec = 'copy';
        }

        convertCommand = ffmpeg(inputFile)
            .format('mp4')
            .videoCodec(cpVideoCodec)
            .audioCodec(cpAudioCodec)
            .on('error', function(err, stdout, stderr) {
                console.log('Cannot process video: ' + err.message);
            })
            .on('start', function(commandLine) {
                global.gVar.conversionFinished = false;
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('progress', function(progress) {
                global.gVar.conversionProgress = progress.percent;
                console.log('Processing: ' + progress.percent + '%done');
            })
            .on('end', function() {
                global.gVar.conversionFinished = true;
                console.log('Processing finished !');
            })
            .save(inputFile + '.mp4');
        resolve(convertCommand);
    });
}

function killConversion(ffmpegCommand) {
    var filePath = ffmpegCommand._currentOutput.target;
    ffmpegCommand.kill();
    fs.unlink(filePath, (err) => {
        if (err) {
            console.log("failed to delete video: " + err);
            console.log("Path: " + filePath);
        } else {
            console.log('successfully deleted video');
        }
    });
}




// Basic functions
exports.search_film = search_film;
exports.add_review = add_review;
exports.get_settings = get_settings;
exports.set_settings = set_settings;
exports.save_edition = save_edition;
exports.save_sync_ref = save_sync_ref;
exports.share_scene = share_scene;
exports.link_file_to_film = link_file_to_film;
exports.merge_local_tags = merge_local_data
exports.get_diff_tag = get_diff_tag
exports.send_feedback = send_feedback
exports.update_tagged = update_tagged
exports.checkConversion = checkConversion;
exports.convertFile = convertFile;
exports.killConversion = killConversion;

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
    //params["version"] = "0.1"; // MODIFY VERSION IN THIS LINE
    // Create query
    var str = [];
    for (var key in params)
        if (params[key]) str.push(key + "=" + encodeURIComponent(params[key]));
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
                return
            }

            try {
                var reply = JSON.parse(body)
            } catch (error) {
                console.log("Invalid response body: ", body)
                resolve({ status: 400 })
                return
            }

            console.log(reply)
            if (reply.data["token"]) set_local_data("token", reply.data["token"])
            if (reply.data["username"]) set_local_data("username", reply.data["username"])
            if (reply.data["permissions"]) set_local_data("permissions", reply.data["permissions"])
            /*if (reply.data["update"] == "force") {
                const { dialog, shell } = require('electron')
                console.log(dialog.showMessageBox({ "type": "info", "title": "New version available", "message": "We got new exiting features for you!", "buttons": ["Try them"] }, function(argument) {
                    shell.openExternal("www.fcinema.org/updates");
                }))
                resolve({ status: 400 })
            }*/
            resolve(reply)

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




var appStartTime;

function trace(name, args) {
    if (!appStartTime) appStartTime = Date.now();
    args = Array.from(args);
    console.log("[TRACE ", Date.now() - appStartTime, "]", name, args)
}