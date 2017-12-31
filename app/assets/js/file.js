/*======================================================================*/
//----------------------------- LIBRARIES ------------------------------//
/*======================================================================*/
const ffmpegPath = require( '@ffmpeg-installer/ffmpeg' ).path;
const spawn = require( "child_process" ).spawn;
const tmp = require( 'tmp' );
const getPixels = require( "get-pixels" )
const which = require( 'which' )



/*======================================================================*/
//----------------- EXTERNALLY CALLABLE FUNCTIONS ----------------------//
/*======================================================================*/

function dumpToFile( input, skip_list, output ) {
    trace( "dumpToFile", arguments )
    // Create skip filters
    var vf = create_ffmpeg_filter( "vf", skip_list )
    var af = create_ffmpeg_filter( "af", skip_list )

    var ff = spawn( "ffmpeg", [ "-i", input, "-vf", vf, "-af", af, output ] );
    ff.stderr.on( 'data', ffmpeg_console_update )
    return 0;
}

/**
 * Play film
 * @param {string} player the media player we want to use (must be one from the list of available players)
 * @param {json} skip_list list of scenes we want to skip (must have "end" and "start" fields )
 * @param {string} output in case player = "file" the path to put th file
 * @returns {number} don't know yet
 */
function play( player, skip_list, output ) {
    trace( "play", arguments )
    // Create skip filters
    var vf = create_ffmpeg_filter( "vf", skip_list )
    var af = create_ffmpeg_filter( "af", skip_list )
        // Get input file
    var input = get_local_data( "input" )

    // Play in ffplayer
    if ( player == "ffplay" ) {
        var ff = spawn( "ffplay", [ "-i", input, "-vf", vf, "-af", af ] );
    }
    // Dump to file
    else if ( player == "file" ) {
        var ff = spawn( "ffmpeg", [ "-i", input, "-vf", vf, "-af", af, output ] );
    }
    // Stream to player TOOD: make sure it actually works
    else {
        var stream = "udp://@127.0.0.1:2000"
        var path = which.sync( player )
            // Open the media player // TODO onclose do something
        spawn( path, [ stream ] )
            // Start the video steam
        var ff = spawn( "ffmpeg", [ "-re", "-i", input, "-vf", vf, "-af", af, "-q:v", 3, "-q:a", 3, "-f", "mpegts", stream ] );
    };
    ff.stderr.on( 'data', ffmpeg_console_update )
    return 0;
}




/**
 * Preview a scene cut
 * @param {string} start where to start skipping in seconds
 * @param {string} end where to stop skipping in seconds
 * @returns {number} don't know yet
 */
function preview( start, end ) {
    // Retrieve input
    var input = get_local_data( "input" )
        // Create skip filters
    var filter = [ { start: start, end: end }, { start: end + 5, end: start - 5 } ]
    var vf = create_ffmpeg_filter( "vf", filter )
    var af = create_ffmpeg_filter( "af", filter )
        // Play in ffplay
    var ff = spawn( "ffplay", [ "-i", input, "-vf", vf, "-af", af, "-x", 500, "-y", 350 ] );
    ff.stderr.on( 'data', ffmpeg_console_update )
    return 0;
}




/**
 * Returns current time (if you are playing something)
 * @returns {number} current time is seconds
 */
function get_current_time() {
    return g_currentTime;
}
var g_currentTime = 0.0;




/**
 * Find and return the sharpest scene change
 * @param {number} start where to start looking
 * @param {number} end where to stop looking
 * @returns {number} timestamp of the first frame after a sharp scene change
 */
function estimate_scene_change( start, end ) {
    trace( "estimate_scene_change", arguments )
    return create_sync_data( start, end ).then( function( sync_data ) {
        var max_distance = 0
        var change_at = -1
        for ( var i = 1; i < sync_data.length; i++ ) {
            var d = hamming_distance( sync_data[ i - 1 ][ 0 ], sync_data[ i ][ 0 ] )
            if ( d > max_distance ) {
                max_distance = d;
                change_at = sync_data[ i ][ 1 ];
            };
        };
        return change_at;
    } )
}




/**
 * Get a list of available players
 * @returns {array} list of available players
 */
function get_players() {
    return new Promise( function( resolve, reject ) {
        var possible_players = [ "vlc", "mplayer", "mpv", "xbmc", "smplayer" ];
        var available_players = [ "ffplay", "file" ];

        for ( var i = 0; i < possible_players.length; i++ ) {
            try {
                which.sync( possible_players[ i ] ); // TODO: this function does not work on MACOS (windows?)
                available_players.push( possible_players[ i ] );
            } catch ( e ) {};
        };

        resolve( available_players );
    } )
}




/**
 * Syncs scene with the local film version
 * @param {string} id id of the scene we want to presync
 * @returns {number} Promise to a number defining how the sync went
 */
function presync_scene( id ) {
    trace( "presync_scene", arguments )
    return new Promise( function( resolve, reject ) {
        // Get basic data
        var film = get_local_data( "currentFilm" );
        if ( !film ) return false;
        var i = find_in_array( film.scenes, id );
        if ( i == -1 ) return false;
        // Make a first estimation of the offset
        // First scene to arrive here will go straight, followings will wait for the first to finish calibrating and improve offset estimation, hence they will calibrate faster
        estimate_time_on_our( film.scenes[ i ].start ).then( ( our_time_approx_start ) => {
            // Get the exact start
            find_this_in_our_version( film.scenes[ i ].start, our_time_approx_start, "start", 5 ).then( ( our_time_start ) => {
                // Get the exact end
                var our_time_approx_end = film.scenes[ i ].end - film.scenes[ i ].start + our_time_start
                find_this_in_our_version( film.scenes[ i ].end, our_time_approx_end, "end", 3 ).then( ( our_time_end ) => {
                    resolve( { star: our_time_start, end: our_time_end } )
                } )
            } )
        } )
    } )
}





// Basic functions
exports.presync_scene = presync_scene;
exports.get_available_players = get_players;
exports.play = play;
exports.dumpToFile = dumpToFile;

// Edition interface
exports.estimate_scene_change = estimate_scene_change;
exports.preview = preview;
exports.get_current_time = get_current_time;





/*======================================================================*/
//----------------------------- HELP FUNCTIONS -------------------------//
/*======================================================================*/


function estimate_time_on_our( time ) {
    return Promise.resolve( time ); // TODO
}

function estimate_time_on_ref( our_time ) {
    return our_time; // TODO
}

function want_to_see( skip_list, our_sync_data, our_time ) {

    return new Promise( function( resolve, reject ) {
        var ref_time_guess = estimate_time_on_ref( our_time );
        var offsets = get_data_offsets( our_sync_data, ref_time_gues );
        var ref_times = { max: our_time + offsets.max, min: our_time + offsets.min } // todo check min/max -> min/max

        var our_next_ok = 0
        var our_next_bad = 24 * 60 * 60
        for ( var i = 0; i < skip_list.length; i++ ) {
            if ( ref_times.min > skip_list[ i ].end ) continue; // point in the past
            // How much do we have until the badness?
            var time_to_bad = skip_list[ i ].start - ref_times.max
            our_next_bad = Math.min( our_next_bad, our_time + time_to_bad )
            if ( ref_times.max > skip_list[ i ].start ) continue; // scene not started
            // How much do we have until the goodness?
            var time_to_good = skip_list[ i ].end - ref_times.min
            our_next_ok = Math.max( our_next_ok, our_time + time_to_good )
        };
        if ( our_next_ok != 0 ) {
            resolve( { want: 0, friendly: our_next_ok, accuracy: ref_times.max - ref_times.min } )
        } else {
            resolve( { want: 1, avoid: our_next_bad, accuracy: ref_times.max - ref_times.min } )
        }
    } );
}


// I want to find where ref_time is in our current movie. I guess it is in our_time_guess. Where is it?
function find_this_in_our_version( ref_time, our_time_guess, typ, ttl ) {
    trace( "find_this_in_our_version", arguments )
    if ( ttl == 0 ) return -1;
    return create_sync_data( guess - 1, our_time_guess + 1 )
        .then( function( our_data ) {
            var offsets = get_data_offsets( our_data, ref_time )
            var our_times = { min: ref_time - offsets.min, center: ref_time - offsets.center, max: ref_time - offsets.max }
                // If our guess was too far away from the real point, the sync_data is far away from the real point, and we might have problems if we have extra/less scenes
            if ( Math.abs( our_times.center - our_time_guess ) > 4 ) {
                return find_this_in_our_version( ref_time, our_times.center, typ, ttl - 1 );
                // If we have a lot of uncertainty
            } else if ( our_times.max - our_times.min > 4 ) {
                return -1
                    // If we are syncing the start, better to remove extra frames that to start cutting late
            } else if ( typ == "start" ) {
                return our_times.min
            } else {
                return our_times.max
            }
        } )
}




/* *
 * Locates the specified time in the reference film.
 * @param {number} our_time the time point (in our current version) that we want to find in the original film
 * @param {json} our_data some our_data of our current film
 * @param {number} guess a first guess to speed up the searching process
 * @returns {json} { min: earliest possible point, center: most probable time, max: latest possible time}
 */
function get_data_offsets( our_data, ref_time_guess ) {
    // TODO: avoid cross-correlating with the whole film (eg. do it by chunks around guess)
    trace( "get_data_offsets", arguments )
    var ref_data = get_local_data( "currentFilm" )[ "syncRef" ] // TODO: this will throw an error if we don't have a currentFilm
        // Set parameters
    var accuracy = 1 / 24; // offset values will be rounded to this precision
    var count_min = 5; // ignore noisy offsets with few points

    // Crosscorrelate
    var d_array = {};
    var d_count = {};
    // For each available point
    for ( var o = our_data.length - 1; o >= 0; o-- ) {
        for ( var r = ref_data.length - 1; r >= 0; r-- ) {
            if ( !ref_data[ r ][ 1 ] || !our_data[ o ][ 1 ] ) continue;
            // Compute time offset and hamming_distance
            var t = ref_data[ r ][ 1 ] - our_data[ o ][ 1 ];
            var d = hamming_distance( ref_data[ r ][ 0 ], our_data[ o ][ 0 ] )
                // Store value in array
            var i_offset = Math.round( t / accuracy ) + "";
            if ( d_array[ i_offset ] == undefined ) {
                d_count[ i_offset ] = 1;
                d_array[ i_offset ] = d;
            } else {
                d_count[ i_offset ] += 1;
                d_array[ i_offset ] += d;
            }
        };
    };

    // Find minimum
    var min_norm_d = 1000;
    var t_min = null;
    for ( var t in d_array ) {
        if ( d_count[ t ] < count_min ) continue
        if ( d_array[ t ] / d_count[ t ] > min_norm_d ) continue;
        min_norm_d = d_array[ t ] / d_count[ t ];
        t_min = t;
    }

    // Find  error interval
    var bef_offset_error = span;
    var aft_offset_error = -span;
    for ( var t in d_array ) {
        if ( d_count[ t ] < count_min / 3 ) continue // Even if it is a noise point, if it has lower distance something might be wrong
        if ( d_array[ t ] / d_count[ t ] > 1.5 * min_norm_d ) continue;
        if ( bef_offset_error > t ) bef_offset_error = t;
        if ( aft_offset_error < t ) aft_offset_error = t;
    }

    function toTime( ind ) {
        return ( ind * accuracy ) }
    // return
    return { min: toTime( bef_offset_error ), center: toTime( t_min ), max: toTime( aft_offset_error ) }
}


function get_thumbnails( start, end, fps, usage ) {
    var input = get_local_data( "input" )
    trace( "get_thumbnails", arguments )
        // Make sure times are reasonable
    if ( start < 0 ) {
        end += -start
        start = 0
    }
    // TODO: check end is reasonable (but we don't know the length :)

    return new Promise( function( resolve, reject ) {
        // Get number of frames
        var nframes = Math.round( ( end - start ) * fps )
            // Get tmp folder
        var tmpFolder = tmp.dirSync().name;
        // Extract thumbails
        if ( usage && usage == "sync" ) {
            var ff = spawn( "ffmpeg", [ "-ss", start, "-i", input, "-vf", "fps=" + fps, "-pix_fmt", "gray", "-s", "16x9", "-vframes", nframes, tmpFolder + "/thumb%06d.png" ] )
        } else {
            var ff = spawn( "ffmpeg", [ "-ss", start, "-i", input, "-vf", "fps=" + fps, "-s", "160x90", "-vframes", nframes, tmpFolder + "/thumb%06d.png" ] )
        }
        // Resolve or reject promise based on exit code
        ff.on( 'close', ( code ) => {
            if ( code == 0 ) {
                var thumbs = [];
                for ( var i = 0; i < nframes; i++ ) {
                    thumbs.push( { time: Math.floor( 1000 * ( start + i / fps ) ), file: tmpFolder + "/thumb" + pad( i + 1, 6 ) + ".png" } )
                };
                resolve( thumbs )
            } else {
                console.log( "get_thumbnails failed: ", code )
                reject( code )
            };
        } );
    } )
}



// Generate thumbnails and return their hash
function create_sync_data( start, end ) {
    trace( "create_sync_data", arguments )
    return get_thumbnails( start, end, 24, "sync" ).then( function( thumbs ) {
        return Promise.all( thumbs.map( create_thumbnail_hash ) )
    } )
}


// Calculate the hash given a file
function create_thumbnail_hash( thumb ) {
    return new Promise( function( resolve, reject ) {
        getPixels( thumb.file, function( err, pixels ) {
            if ( err ) {
                resolve( [] ) // standard would be to "reject", but we are inside a "Promise.all" and missing one point is okay
            } else {
                var hash = bitmap_to_hash( pixels.data )
                resolve( [ hash, thumb.time ] )
            }
        } )
    } )
}

function bitmap_to_hash( data ) {
    var base64 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
    var hash = ""
    data.push( data[ 0 ] ) // To compare last with first one (dunno how efficient this is)
    for ( var i = 4; i < data.length; i += 24 ) {
        var n = ( data[ i - 4 + 0 ] > data[ i + 0 ] ) * 1
        n += ( data[ i - 4 + 4 ] > data[ i + 4 ] ) * 2
        n += ( data[ i - 4 + 8 ] > data[ i + 8 ] ) * 4
        n += ( data[ i - 4 + 12 ] > data[ i + 12 ] ) * 8
        n += ( data[ i - 4 + 16 ] > data[ i + 16 ] ) * 16
        n += ( data[ i - 4 + 20 ] > data[ i + 20 ] ) * 32
        hash += base64.charAt( n )
    };
    return hash;
}



// Calculate the hamming distance between two base64 encoded strings
function hamming_distance( a, b ) {
    var digitsMap = { "0": "000000", "1": "000001", "2": "000010", "3": "000011", "4": "000100", "5": "000101", "6": "000110", "7": "000111", "8": "001000", "9": "001001", "A": "001010", "B": "001011", "C": "001100", "D": "001101", "E": "001110", "F": "001111", "G": "010000", "H": "010001", "I": "010010", "J": "010011", "K": "010100", "L": "010101", "M": "010110", "N": "010111", "O": "011000", "P": "011001", "Q": "011010", "R": "011011", "S": "011100", "T": "011101", "U": "011110", "V": "011111", "W": "100000", "X": "100001", "Y": "100010", "Z": "100011", "a": "100100", "b": "100101", "c": "100110", "d": "100111", "e": "101000", "f": "101001", "g": "101010", "h": "101011", "i": "101100", "j": "101101", "k": "101110", "l": "101111", "m": "110000", "n": "110001", "o": "110010", "p": "110011", "q": "110100", "r": "110101", "s": "110110", "t": "110111", "u": "111000", "v": "111001", "w": "111010", "x": "111011", "y": "111100", "z": "111101", "+": "111110", "-": "111111" }
    var distance = 0;
    for ( var i = 0; i < 24; i++ ) {
        if ( a.charAt( i ) == b.charAt( i ) ) continue;
        var ai = digitsMap[ a.charAt( i ) ]
        var bi = digitsMap[ b.charAt( i ) ]
        for ( var j = 0; j < 6; j++ ) {
            distance += ( ai.charAt( j ) == bi.charAt( j ) )
        };
    };
    return distance;
}



// Create a ffmpeg filter
function create_ffmpeg_filter( stream, times ) {
    /* http://stackoverflow.com/q/39122287/3766869 by Mulvya
    ffplay -vf "select='lte(t\,4)+gte(t\,16)',setpts=N/FRAME_RATE/TB" -af "aselect='lte(t\,4)+gte(t\,16)',asetpts=N/SR/TB" -i INPUT*/
    var filter = [];
    for ( var i = 0; i < times.length; i++ ) {
        filter.push( "(lte(t\," + times[ i ].start + ")" + "+gte(t\," + times[ i ].end + "))" )
    }
    if ( stream == "vf" ) {
        return ( "fps,select='" + filter.join( "*" ) + "',setpts=N/FRAME_RATE/TB" )
    } else if ( stream == "af" ) {
        return ( "aselect='" + filter.join( "*" ) + "',asetpts=N/SR/TB" )
    } else {
        return filter.join( "*" )
    };
}


//http://stackoverflow.com/a/10073788/3766869
function pad( n, width, z ) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array( width - n.length + 1 ).join( z ) + n;
}



function ffmpeg_console_update( data ) {
    console.log( "Got this update from ffplay/mpeg: ", data.toString() )
    var timeRegex = /^ +(\d+.\d+)/;
    var matched = timeRegex.exec( data.toString() )
    if ( matched ) {
        g_currentTime = matched[ 1 ]
    } else {
        console.log( data.toString() )
    }
}


var appStartTime = null
function trace( name, args ) {
    if ( !appStartTime ) appStartTime = Date.now();
    args = Array.from( args );
    console.log( "[TRACE ", Date.now() - appStartTime, "]", name, args )
}