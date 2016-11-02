//Add fcinema code here


var list = {"IDs":["tt5237706","tt5237714","tt5255582","tt5255590","tt5257872","tt5257920","tt5257962","tt5258034","tt5258124","tt5258146"],"Titles":["Eighteen Years Lost","Turning the Tables","Plight of the Accused","Indefensible","The Last Person to See Teresa Alive","Testing the Evidence","Framing Defense","The Great Burden","Lack of Humility","Fighting for Their Lives"],"Directors":[null,null,null,null,null,null,null,null,null,null],"Season":[1,1,1,1,1,1,1,1,1,1],"Episode":["1","2","3","4","5","6","7","8","9","10"],"Released":["2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18"],"ImdbRating":["8.4","8.7","8.9","9.2","9.1","8.6","8.6","8.7","9.3","8.8"],"ImdbCode":"tt5189670"}
var film = {"ImdbCode":"tt0944943","Title":"#DUPE#","Director":"Kjell-\u00c5ke Andersson","PGCode":null,"ImdbRating":"5.9","Released":"05 Nov 2007","Actors":"Krister Henriksson, Johanna S\u00e4llstr\u00f6m, Ola Rapace, Ellen Mattsson","Writers":null,"Plot":"Tracking a sadistic killer, detective Kurt Wallander follows a string of incidents -- attacks on domestic animals, ritualistic murders of humans -- with help from his daughter, Linda, a new member of the Ystad police force.","Runtime":"89 min","Genre":"Crime, Drama, Mystery","Awards":null,"Poster":"http:\/\/ia.media-imdb.com\/images\/M\/MV5BMTc0MTc0MTQxMF5BMl5BanBnXkFtZTcwMjI0MjA0MQ@@._V1_SX300.jpg","Scenes":[],"SeriesID":"tt0907702"}
var default_reference = {"start":60.46,"end":61.085,"data":[["0JEmM28d0r9GD2GZ0eF0w30R",79460],["0JEmM28d0r9GD2GZ0eF0w30R",79501],["0DEGM2ac0r9GD3GZ0eF0w30R",79543],["0D8GI3acWsCe53wZ0eF0w30R",79585],["0B8GQ3acWsCe53wn0eF0w30R",79626],["058GA22ZWwCe63gn0iF0w3WP",79668],["079OB2IZWwEec3un0iF0w3WP",79710],["079892Ip0QEWc1un0iF0u3WP",79751],["W588D2Ip0REmY1yn0aF0v3WP",79793],["W58852on0REGZ2qu0cF0n3WO",79835],["W58852on0PEGZ2qe0MF0n3WO",79876],["WX8853Yn0TAGp2qe0MD0L3WO",79918],["W08e53gn0TAGp2qe06D0n3WO",79960],["W08e42gn0DBOp2+i0sF0n3WO",80001],["W08e42gnWDFOn2Ui0tF0v3WU",80043],["yae39E0W14eO6ADm36y0J2W0",80085],["S4x3XD0m1VgG6Z5mO1860Y1G",80126],["Rqi3PEGi18kO0QOmMCy06A0G",80168],["Rmi3PEGi18kO8QOm6Cu06B0I",80210],["y8j3dF0d12hiWXoma98m43CO",80251],["Pet3qEG+19subvoNaGd1WP0G",80293],["+ad3xF0t1ct8pacP1p4Wn1mO",80335],["+ad3xF0t1ct8pacP1p4Wn1mO",80376],["i4t3yDGx1vtqu8v6mO7Cj16E",80418],["viv3Rkmd1ivCUOd33RGWT4m6",80460],["y0e3EEmZ1+eWDYn3mS0O62C3",80501],["y0e3CEmZ1+eWDYn3mS0O62C3",80543],["S0i36Fmn1Ueq6ouXOE8C32tH",80585],["y0u3GFOi17guXcRep7ivWnC8",80626],["SGu30ECk33fzGYFqv3sSmO64",80668],["SGu30ECc33fzGYFqv3sSmO64",80710],["RMu10E2ZdnePOc7oy1UUmk3M",80751],["CZen8E8nO8e72vX8UWf79x09",80793],["aXuO06Cl04q3XzGiBav3i-WL",80835],["aXuO06Cl04q3XzGiBav3i-W5",80876],["s0zDe2Mq0SKXyQ8c7se1cVmK",80918],["T083Op1RGBJuO6EpXQSe178G",80960],["S0k10vXVGb3CD3ZfmCCi53bG",81001],["S0k10vXVGb3CD3ZfmCCi53bG",81043],["S0+1WjnSOw1J6omci6Boa2cG",81085],["U0s7m1B72R7mXDCWk9eD6YD0",81126],["U0sDm0ZRYy3inXDGzO8d6o44",81168],["U0sDm0ZRYy3inXDGzO8d4o44",81210],["V0pCOWpF7Usmqe6RywCpSQ26",81251],["V0mCM0w34t0S7Wb7i1pCqc3C",81293],["-WuCB0sJuR0tBwud6oHaSI06",81335],["-WuCB0sJuR0tBwuZ6oHaSI06",81376],["-GuR6E+9nF4lnOybJ+OZEAW3",81418]]}



//60.21 64.18
// Load required libraries
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const spawn = require("child_process").spawn;
const tmp = require('tmp');
//const FileReader = require('filereader')
//const fs = require("fs");
//const shash = require('sharp-blockhash');
const get_pixels = require("get-pixels")
const hammingDistance = require('hamming-distance');
const openSubtitles = require('opensubtitles')
const get_filesize = require('file-bytes')
const which = require('which')
const httpRequest = require('request');

const PouchDB = require('pouchdb');
var localDB = new PouchDB('localData');

//ffmpeg.setFfmpegPath(ffmpegPath);



// Compute opensubtitles compliant hash and filesize
//https://trac.opensubtitles.org/projects/opensubtitles/wiki/HashSourceCodes
function parse_input_file ( input ){
  trace( "parse_input_file", arguments )
  return get_filesize( input ).then( function ( filesize ) {
    return new Promise( function (resolve, reject) {
      var oSub = new openSubtitles()
      oSub.computeHash( input, function ( err, hash ) {
        var title = title_from_filename( input )
        resolve({hash:hash,filesize:filesize+"",estimated_title:title})
      })
    })
  })
}


// Ask server for film information
function search_film( hash, bytesize, title, imdbid ) {
  trace( "search_film", arguments )
  return call_online_api( { action:"search", filename:title, imdb_code:imdbid, hash:hash, bytesize:bytesize } )
}



// Get the exact times {start,end} of a scene based on hash reference and helped by approx times
function get_scene_exact_times ( input, approx_start, approx_end, reference ) {
  trace( "get_scene_exact_times", arguments )
  guessed_offset = 20
  // Find the offset for the start
  console.time("exact_time")
  return get_point_offset( input, approx_start+guessed_offset, 2, reference.data )
    // Once we have the start, find the offset for the end (99.9% of the times will be at approx_end+start_offset but who knows)
    .then( function ( start_offset ) {
      console.log( "exact start at ", approx_start+start_offset )
      return get_point_offset( input, approx_end+start_offset, 2, reference.data )
      // Once we have the start and the end times, return the values {start:ss.mmm,end:ss.mmm}
      .then( function ( end_offset ) {
        console.log( "exact start at ",approx_start+start_offset," exact end at ",approx_end+end_offset )
        console.timeEnd("exact_time")
        return { start:start_offset+start_offset, end:end_offset+end_offset }
      })
    }).catch( function (argument) {
      return {start:-1,end:-1}
    } )
}



function get_point_offset ( input, time, span, reference ) {
  trace( "get_point_offset", arguments )
  return create_sync_data( input, time-span/2, time+span/2 )
    .then( function ( this_version ) {
      //console.log( JSON.stringify( this_version ) )
      var exact_time = crosscorrelate( reference, this_version, span )
      console.log( exact_time )
      if ( Math.abs(exact_time.max - exact_time.min ) < 0.2  && exact_time.center != null) {
        return exact_time.center
      } else if ( span < 256 ) {
        return get_point_offset( input, time, span*4, reference )
      } else {
        console.log("Unable to find offset, sorry mate")
        reject()
      }
    })
}



// Perform crosscorrelation operation to find a our clip inside a ref clip
function crosscorrelate( ref, our, span ){
  trace( "crosscorrelate", arguments )
// Set parameters
  var accuracy   = 1/24; // group offsets closer than 'accuracy'
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


function estimate_scene_change ( input, start, end ) {
  trace( "estimate_scene_change", arguments )
  return create_sync_data( input, start, end ).then( function ( sync_data ) {
    var max_distance = 0
    var change_at = -1
    for (var i = 1; i < sync_data.length-1; i++) {
      var d = hamming_distance( sync_data[i-1][0], sync_data[i][0] )
      if ( d > max_distance) {
        max_distance = d;
        change_at = sync_data[i][1];
      };
    };
    return change_at;
  })
}


// Return a list of availble players
function get_available_players () {
  return new Promise( function (resolve, reject) {
    var possible_players = ["vlc","mplayer","mpv","xbmc","smplayer"];
    var available_players = ["ffplay","file"];

    for (var i = possible_players.length - 1; i >= 0; i--) {
      try {
        which.sync( possible_players[i] );
        available_players.push( possible_players[i] );
      } catch(e){};
    };

    resolve( available_players );
  })
}


function play ( input, player, filters, output ) {
// Create skip filters
  var vf = create_ffmpeg_filter( "vf", filters )
  var af = create_ffmpeg_filter( "af", filters )

// Play in ffplayer
  if( player == "ffplay" ){
    spawn("ffplay",["-i",input,"-vf",vf,"-af",af],{stdio:"ignore"});
  }
// Dump to file
  else if ( player == "file" ) {
    spawn("ffmpeg",["-i",input,"-vf",vf,"-af",af,output],{stdio:"ignore"});
  }
// Stream to player
  else {
    output = "udp://@127.0.0.1:2000"
    var path = which.sync( player ) // todo make async
    spawn( path,[output] )
    spawn("ffmpeg",["-re","-i",input,"-vf",vf,"-af",af,"-q:v",3,"-q:a",3,"-f","mpegts",output],{stdio:"ignore"});
    //ffmpeg -re -i $file -q:v 3 -q:a 3 -f mpegts udp://127.0.0.1:2000
  };
  return 0;
}

function preview ( input, filter ) {
  filters = [filter,{start:filter.start-3,end:filter.end+3}]
// Create skip filters
  var vf = create_ffmpeg_filter( "vf", filters )
  var af = create_ffmpeg_filter( "af", filters )

// Play in ffplayer
  var ff = spawn("ffplay",["-i",input,'-f', 's16le',"-vf",vf,"-af",af,"-x",300,"-y",220,"pipe:1"]);
  ff.stdout.on('data', (data) => { console.log(data.toString() ) });
  ff.stderr.on('data', (data) => { console.log(data.toString() ) });
  return 0;
}

function get_current_time (){
  return 9.235;
}

function get_thumbnails ( input, start, end, fps, usage ) {
  trace( "get_thumbnails", arguments )
// Make sure times are reasonable
  if ( start < 0 ) {
    end   += -start
    start = 0
  };

  return new Promise( function (resolve, reject) {
  // Set default fps
    var fps = fps? fps : 24

    var nframes = Math.round( (end-start)*fps )
  // Get tmp folder
    var tmpFolder = tmp.dirSync().name;
  // Extract thumbails
    if( usage && usage == "sync"){
      var ff = spawn("ffmpeg",["-ss",start,"-i",input,"-vf","fps="+fps,"-pix_fmt","gray","-s","16x9","-vframes",nframes,tmpFolder+"/thumb%04d.png"])
    } else {
      var ff = spawn("ffmpeg",["-ss",start,"-i",input,"-vf","fps="+fps,"-s","160x90","-vframes",nframes,tmpFolder+"/thumb%04d.png"])
    }
  // Resolve or reject promise based on exit code
    ff.on('close', (code) => {
      if ( code == 0 ) {
        var thumbs = [];
        for (var i = 0; i < nframes; i++) {
          thumbs.push( { time : Math.floor(1000*(start+i/fps)), file : tmpFolder+"/thumb"+pad(i+1,4)+".png" } )
        };
        resolve( thumbs )
      } else{
        console.log( "get_thumbnails failed: ", code )
        reject( code )
      };
    });
  })
}

// Generate thumbails and return their hash
function get_sync_reference ( input, start, end ) {
  trace( "get_sync_reference", arguments )
  var outer_span  = 10;
  var innter_span = 10;
  if ( end - start > innter_span*2 ) {
    var s1 = start - outer_span;
    var s2 = start + outer_span;
    var e1 = end   - outer_span;
    var e1 = end   + outer_span;
  } else {


  };
  return new Promise( function (resolve, reject) {
    create_sync_data( input, start, end ).then( function ( data ) {
      var ref = { "start":start, "end":end, "data":data };
      resolve( ref )
    }).catch(function(e) {
      console.log(e);
      reject( e );
    })
  })
}


// Generate thumbails and return their hash
function create_sync_data ( input, start, end ) {
  trace( "create_sync_data", arguments )
  return get_thumbnails( input, start, end, 24, "sync" ).then( function ( thumbs ) {
    return Promise.all(
      thumbs.map( create_thumbnail_hash )
    )/*.then( function ( hash ) {
      var hashs = []
      var times = []
      for (var i = 0; i < hash.length; i++) {
        hashs.push( hash[i].hash )
        times.push( hash[i].time )
      };
      return ({times:times,hashes:hashs})
    })*/
  })
}




function create_thumbnail_hash2 ( thumb ) {
  trace( create_thumbnail_hash2, arguments )
  return new Promise( function (resolve, reject) {
    //console.time("create_thumbnail_hash2"+thumb.file);
    get_pixels( thumb.file, function(err, pixels) {
      if ( err ) {
        resolve( {} ) // standard would be to "reject", but we are inside a "Promise.all" and missing one point is okey
      } else {
        var hash = ""
        for (var i = 4, data = pixels.data; i < data.length; i+=4) {
          hash += ( (data[i-4]>data[i])? 0 : 1 )
        };
        //console.timeEnd("create_thumbnail_hash2"+thumb.file);
        //console.log(hash)
        resolve( {hash:hash,time:thumb.time} )
      }
    })
  })
}

function create_thumbnail_hash ( thumb ) {
  return new Promise( function (resolve, reject) {
    //console.time("get_pixels"+thumb.file);
    get_pixels( thumb.file, function(err, pixels) {
      //console.timeEnd("get_pixels"+thumb.file);
      //console.time("create_thumbnail_hash2"+thumb.file);
      if ( err ) {
        resolve( {} ) // standard would be to "reject", but we are inside a "Promise.all" and missing one point is okey
      } else {
        var digitsStr =
    //   0       8       16      24      32      40      48      56     63
    //   v       v       v       v       v       v       v       v      v
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
        var hash = ""
        var data = pixels.data; data[data.length-1] = data[0]
        for (var i = 4; i < data.length; i+=24) {
          var n = ( data[i-4+00] > data[i+00] ) * 1
          n += ( data[i-4+04] > data[i+04] ) * 2
          n += ( data[i-4+08] > data[i+08] ) * 4
          n += ( data[i-4+12] > data[i+12] ) * 8
          n += ( data[i-4+16] > data[i+16] ) * 16
          n += ( data[i-4+20] > data[i+20] ) * 32
          hash += digitsStr.charAt(n)
        };
        //console.timeEnd("create_thumbnail_hash2"+thumb.file);
        //resolve( {hash:hash,time:thumb.time} )
        resolve( [hash,thumb.time] )
      }
    })
  })
}


function hamming_distance2 ( a, b ) {
  var av = a.split("")
  var bv = b.split("")
  var distance = 0;
  for (var i = av.length - 1; i >= 0; i--) {
    if( av[i] != bv[i] ) distance++
  };
  return distance;
}

function make_map() {
  var digitsStr =
  //   0       8       16      24      32      40      48      56     63
  //   v       v       v       v       v       v       v       v      v
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
  var digits = digitsStr.split('');
  var digitsMap = {};
  for (var i = 0; i < digits.length; i++) {
      digitsMap[digits[i]] = pad( i.toString(2), 6 );
  }
  return digitsMap;

}

function hamming_distance ( a, b ) {
  var digitsMap = {"0":"000000","1":"000001","2":"000010","3":"000011","4":"000100","5":"000101","6":"000110","7":"000111","8":"001000","9":"001001","A":"001010","B":"001011","C":"001100","D":"001101","E":"001110","F":"001111","G":"010000","H":"010001","I":"010010","J":"010011","K":"010100","L":"010101","M":"010110","N":"010111","O":"011000","P":"011001","Q":"011010","R":"011011","S":"011100","T":"011101","U":"011110","V":"011111","W":"100000","X":"100001","Y":"100010","Z":"100011","a":"100100","b":"100101","c":"100110","d":"100111","e":"101000","f":"101001","g":"101010","h":"101011","i":"101100","j":"101101","k":"101110","l":"101111","m":"110000","n":"110001","o":"110010","p":"110011","q":"110100","r":"110101","s":"110110","t":"110111","u":"111000","v":"111001","w":"111010","x":"111011","y":"111100","z":"111101","+":"111110","-":"111111"}
  var distance = 0;
  for (var i = 0; i <= 23; i++) {
    if( a.charAt(i) == b.charAt(i) ) continue;
    var b1 = digitsMap[ a.charAt(i) ]
    var b2 = digitsMap[ b.charAt(i) ]
    for (var j = 5; j >= 0; j--) {
      distance += ( b1.charAt(j) == b2.charAt(j) )
    };
  };
  return distance;
}

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


// Call fcinema api, return object
function call_online_api ( params ) {
  var url = "http://fcinema.org/api2"
  var str = [];
  for(var key in params) if(params[key]) str.push( key + "=" + params[key] );
  if( str.length != 0 )url = url+"?"+str.join("&")

  return new Promise(function(resolve, reject) {
    httpRequest( url, function(error, response, body) {
      if( error ){
        reject( "Network Error" )
      } else {
        resolve( JSON.parse( body ) )
      }
    });
  });
}




function presync_scene ( id ) {
  // body...
}

function add_scene ( start, end, tags, comment, id ) {
  trace( "add_scene", arguments )

  return create_sync_data( input, start-10, end+10 ).then( function ( data ) {
    if ( !data ) return -1;

    var scene = {
      id:       "548d568d5eudk",
      tags:     tags,
      comment:  comment,
      start:    start,
      end:      end,
      syncData: data
    }

    var film = get_local_data( imdbid )
    for ( var i = 0, found = 0; i < film.scenes.length; i++) {
      if( film.scenes[i]["id"] == id ) {
        film.scenes[i] = scene;
        found = 1; break;
      }
    };
    if( found != 1 ) film.scenes.push( scene );
    set_local_data( film )

    console.log( get_local_data( imdbid) )

  })
}

function get_local_data ( id ) {
  trace( "get_local_data", arguments )
  return localData[id]
}

function set_local_data ( data, alternative_id ) {
  trace( "set_local_data", arguments )
  var id = data["id"]? data["id"]["imdbid"] : alternative_id
  localData[id] = data;
}

var localData = {}



function remove_scene ( id ) {
  var film = get_local_data( id )
  for (var i = 0; i < film.scenes.length-1; i++) {
    if( film.scenes[i]["id"] == id ) {
      film.scenes[i].splice( i, 1 )
      set_local_data( film )
      return 1
    }
  };
  return -1
}

function play( player, skip_list, output ){

}

function search ( file, title, imdbid ) {
  trace( "search", arguments )
  if ( !imdbid && file ) {
    console.log( "searching by file ")
    return parse_input_file( file ).then( function ( stats ) {
      console.log( "file stats are: ", JSON.stringify( stats ) )
      call_online_api( { action:"search", filename:stats.estimated_title, hash:stats.hash, bytesize:stats.filesize } ).then( function ( film ) {
        if ( film["status"] == 0 ) set_local_data( film["data"] )
        return film;
      })
    })
  } else {
    return call_online_api( { action:"search", filename:title, imdb_code:imdbid } ).then( function ( film ) {
      if ( film["status"] == 0 ) set_local_data( film["data"] )
      return film;
    })
  }
  
}

function test () {
  var input = "/home/miguel/videoLab/1/Homeland.S03E02.mp4"
  //search( "/home/miguel/videoLab/1/Homeland.S03E02.mp4", undefined, "tt0000000" )
  log_in( "pepe", "pepe" )
  //play ( input, "ffplay", [{start:3.21,end:10.42},{start:13.21,end:20.42},{start:23.21,end:40.42}], "/home/miguel/videoLab/test.mp4" )
  //preview ( input, {start:23.21,end:40.42}  )
  //get_scene_exact_times ( input, default_reference.start, default_reference.end, default_reference )  
}

function trace ( name, args ) {
  console.log( "+ function",name,"called with",args,"at", Date.now() )
}

function add_review ( imdb_code, review ) {
  trace( "add_review", arguments )
  var token = get_local_data( "token" )
  return call_online_api( { action:"review", review:review, token:token } )
}

function log_in ( user, pass ) {
  trace( "log_in", arguments )
  return call_online_api( { action:"login", username:user, password:pass } ).then( function ( reply ) {
    if ( reply["status"] == 200 ) set_local_data( reply["data"]["token"], "token" )
  })
}

function new_user ( user, pass ) {
  return call_online_api( { action:"newuser", username:user, password:pass } )
}

function new_pass ( user, pass, newpass ) {
  return call_online_api( { action:"newpass", username:user, password:pass, newpass:newpass } )
}

function share_scenes ( ) {
  return call_online_api( { action:"newpass", username:user, password:pass, newpass:newpass } )
}

function auto_assign ( ) {
  return call_online_api( { action:"claim", imdb_code:imdbid } )
}

// Expose functions
exports.get_id_from_file          = test;
exports.get_content_by_id         = test;
exports.get_offset_with_reference = test;
exports.get_available_players     = test;
exports.preview                   = test;
exports.get_current_time          = test;
exports.get_thumbnails            = test;
exports.get_sync_reference        = test;



exports.presync_scene = presync_scene;
exports.add_scene     = add_scene;
exports.estimate_scene_change     = estimate_scene_change;
exports.remove_scene  = remove_scene;

exports.play          = play;
exports.search_film   = search;

exports.add_review    = add_review;
exports.share_scenes  = share_scenes;

exports.new_user      = new_user;
exports.new_pass      = new_pass;
exports.log_in        = log_in;
exports.auto_assign   = auto_assign;
