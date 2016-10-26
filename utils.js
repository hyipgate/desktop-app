//Add fcinema code here


var list = {"IDs":["tt5237706","tt5237714","tt5255582","tt5255590","tt5257872","tt5257920","tt5257962","tt5258034","tt5258124","tt5258146"],"Titles":["Eighteen Years Lost","Turning the Tables","Plight of the Accused","Indefensible","The Last Person to See Teresa Alive","Testing the Evidence","Framing Defense","The Great Burden","Lack of Humility","Fighting for Their Lives"],"Directors":[null,null,null,null,null,null,null,null,null,null],"Season":[1,1,1,1,1,1,1,1,1,1],"Episode":["1","2","3","4","5","6","7","8","9","10"],"Released":["2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18"],"ImdbRating":["8.4","8.7","8.9","9.2","9.1","8.6","8.6","8.7","9.3","8.8"],"ImdbCode":"tt5189670"}
var film = {"ImdbCode":"tt0944943","Title":"#DUPE#","Director":"Kjell-\u00c5ke Andersson","PGCode":null,"ImdbRating":"5.9","Released":"05 Nov 2007","Actors":"Krister Henriksson, Johanna S\u00e4llstr\u00f6m, Ola Rapace, Ellen Mattsson","Writers":null,"Plot":"Tracking a sadistic killer, detective Kurt Wallander follows a string of incidents -- attacks on domestic animals, ritualistic murders of humans -- with help from his daughter, Linda, a new member of the Ystad police force.","Runtime":"89 min","Genre":"Crime, Drama, Mystery","Awards":null,"Poster":"http:\/\/ia.media-imdb.com\/images\/M\/MV5BMTc0MTc0MTQxMF5BMl5BanBnXkFtZTcwMjI0MjA0MQ@@._V1_SX300.jpg","Scenes":[],"SeriesID":"tt0907702"}
var default_reference = [{"hash":"11111110000001111111011110011111111101011011111111100101111001001111110110101100111111001111110011111101011001101111111110110111111111111000011","time":60.21},{"hash":"11111110000001111111011110011111111101011011111111100101111001001111110110101100111111001111110011111101011001101111111110110111111111111000011","time":60.251666666666665},{"hash":"11111111000001111111011110011111111111011011111111100101111001001111110110101100111111001111110011111101011001101111111110110111111111111000011","time":60.29333333333334},{"hash":"11111110000001111111011110011111111101011011111111100101111001001111110110101100111111001111110011111101011001101111111110110111111111111000011","time":60.335},{"hash":"11111110000001111111011110001111111101011011111111100101111001001111110110101100111111001111110011111101011001101111111110110111111111111000011","time":60.376666666666665},{"hash":"11111110010001111111011110001111111101011011111111100100111001001111110110101100111111000111110011111101011001101111111110110111111111111000011","time":60.41833333333334},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111000111110011111101011001101111111110110111111111111000011","time":60.46},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111000111110011111101011001101111111110110111111111111000011","time":60.501666666666665},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111000111110011111101011001101111111110110111111111111000011","time":60.54333333333334},{"hash":"11111110010001111111011110001111111101011011111111100100111001001111110110101100111111000111110011111101011001101111111110110111111111111000011","time":60.585},{"hash":"11111110010001111111011110001111111101011011111111100100111001001111110110101100111111000111110011111101011001101111111110110111111111111000011","time":60.626666666666665},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111000111110011111101011001101111111110110111111111111000011","time":60.66833333333334},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111000011110011111101011011101111111110110111111111111000011","time":60.71},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111000011110011111101011001101111111110110111111111111000011","time":60.751666666666665},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111000011110011111101011001101111111110110111111111111000011","time":60.79333333333334},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111001011110011111101011011101111111110110111111111111000011","time":60.835},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111001011110011111101011001101111111110110111111111111000011","time":60.876666666666665},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111010011110011111101011001101111111110110111111111111000011","time":60.91833333333334},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111010011110011111101011001101111111110110111111111111001011","time":60.96},{"hash":"11111110010001111111011110001111111101011011111111100100111001001111110110101100111111010011110011111101011001101111111100110111111111111000011","time":61.001666666666665},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111001011110011111101011001101111111110110111111111111000011","time":61.04333333333334},{"hash":"11111110010001111111011110001111111101011011111111100100111001001111110110101100111111001011110011111101011001101111111110110111111111111000011","time":61.085},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111001011110011111101011011101111111110110111111111111001011","time":61.126666666666665},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111000011110011111101011011101111111110110111111111111001011","time":61.16833333333334},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111000011110011111101011011101111111100110111111111111000011","time":61.21},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111001011110011111101011001101111111110110111111111111001011","time":61.251666666666665},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111000011110011111101011011101111111110110111111111111000011","time":61.29333333333334},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111010011110011111101011001101111111100110111111111111000011","time":61.335},{"hash":"11111110010001111111011110001111111101011011111111100100111001001111110110101100111111010011110011111101011001101111111110110111111111111000011","time":61.376666666666665},{"hash":"11111110000001111111011110001111111101011011111111100100111001001111110110101100111111010011110011111101011001101111111110110111111111111000011","time":61.41833333333334},{"hash":"11111110010001111111011110001111111101011011111111100100111001001111110110101100111111010011110011111101011011101111111110110111111111111000011","time":61.46},{"hash":"11111110010001111111011110001111111101011011111111100100111001001111110110101100111111010011110011111101011001101111111110110111111111111000011","time":61.501666666666665},{"hash":"11111110100111111111010001001111111110001000011111111100001111110110110011110011011110001101001101110001110000111101001111000111100011110110011","time":61.54333333333334},{"hash":"11111110100111111111010001001111111110001100111111111100000111110110110000110011011110001101001101110001110000111101001111000111100011111110011","time":61.585},{"hash":"11111110100111111111010000011111111110001100111111111100000011110110110000111111011110000111001101110000110000111101000111000111100011111110011","time":61.626666666666665},{"hash":"11111110001111111111010000011111111110001100111111111100010001110110110000011111011110110011101101110000011000111111010111000111100011111110011","time":61.66833333333334},{"hash":"11111110001111111111010000011111111110001100111111111100011001110110110010000111011110010001111101110001001110111111010011100011100010111110011","time":61.71},{"hash":"11111110001111111111010000011111111110001101111111111100000001110110110010000111011110010001111101110001001110111111010011100011100011111110011","time":61.751666666666665},{"hash":"11111110001111111111010000011111111110001001111111111100000001110110110010000111011110010001011101110001000100111111010001110011100011111110011","time":61.79333333333334},{"hash":"11111110001111111111010000111111111110001001111111111100000001110110110010000111011110010001011101110001010100111110010110110111100011111110011","time":61.835},{"hash":"11111110001111111111010000111111111110000001111111111100000001110110110010000111011110010001011101110001010001111110010110010111100011111110011","time":61.876666666666665},{"hash":"11111110001111111111010000111111111110000001111111111100000011110110110010000111011110010001011101110001010001111110010111000111100011111110011","time":61.91833333333334},{"hash":"11111110001111111111010000111111111110000001111111111100000011110110110010000111011110010001011101110001110001111110010111000111101011111110011","time":61.96},{"hash":"11111110001111111111010000111111111110000001111111111100000011110110110010000111011110010001011111110001110001111110011011100111101011111110011","time":62.001666666666665},{"hash":"10111110001111111111010000111111111110000001111111111100000011110110110010000111011110010001011111110010010001111110011111100111101011111110111","time":62.04333333333334},{"hash":"10111110001111111111010000111111111110000001111111111100000011110110110010000111111110011001011111110011010001111110001101100111101001111110111","time":62.085},{"hash":"10111110001111111111011000111111111110000001111111111100000011110110110010000111111110011001011111110011010001111110001100100111101000111110111","time":62.126666666666665},{"hash":"10111110001111111111001000011111111110000001111111111100000001110110110010000111111110011001011111110011010001111110011100110111101000111110111","time":62.16833333333334},{"hash":"10111110001111111111001000011111111110000001111111111100000001110110110010000111111110011001011111110011010001111110011100110111101000111110111","time":62.21},{"hash":"10111110001111111111101000011111111110000100111111111100000001110110110010000111111110011001001111110010000100111110011100110111111001111110111","time":62.251666666666665},{"hash":"10111110001111111111101000011111111110000100111111111100000001110010110010000111111110011001001111110010000100111111011101110111111001111100111","time":62.29333333333334},{"hash":"10111111001111111111101000011111111110000100111111111100001001110010110010000111111110011001001111110010000100111111001111110111111000111100111","time":62.335},{"hash":"10111111001111111011101000011111111110000100111111111100001001111010110010000111101110011000001111111010000100111111001111110111111000111100111","time":62.376666666666665},{"hash":"10111111000111111011101000011111111111000100111111111100001001111010111010000111101110011000001110111010000100111111001111110111111000111100111","time":62.41833333333334},{"hash":"10111111000111111011101000011111111111000100111111111100001001111010111010000111101111011000101110111010001110111111001111110111111000111100111","time":62.46},{"hash":"10111111000111111011101000001111111111000100111111111100001001111010111010000011101111011000101110111010001110111111001111110111111100111100111","time":62.501666666666665},{"hash":"10111111000111111011101000001111111111000100011111111100001000111010111010000011101111011000101110111010001110111111001111110111111100111100111","time":62.54333333333334},{"hash":"10111111000111111011101000001111111110000100011111111100001000111010111010000011101111011000101110111010001110111111001111110111111100111100111","time":62.585},{"hash":"10111111010111111011101000001111111110000100011111111100001000111010111010000011101111011000101111111010001110111111001011110111111100111100111","time":62.626666666666665},{"hash":"11111111010111111011101000001111111110000100011111111100001000111010111010000011101111011000101111111000001110111111001011110111111100111100111","time":62.66833333333334},{"hash":"11111111010111111011101000001111111110000110011111111100001000111010111010000011101111011000101111111000001110111011001011100111111100111101111","time":62.71},{"hash":"11111111010111111011101000001111111110000110011111111100001100111010111010000011101111011000101111111000001110111011001011100111111100111101111","time":62.751666666666665},{"hash":"11111111010011111011101000001111111110000110011111111100001100111010111010000011101111011000101111111000001110111011001011100111111100111101111","time":62.79333333333334},{"hash":"11111111010011111111101000101111111110000110001111111100001100111010111010000011101111011000101111111000001110111011001011001111111100111101111","time":62.835},{"hash":"11111111010011111111101000101111111110000110001111111100001100111010111010000011001111011000100111111000001110111011001011001111111100111101111","time":62.876666666666665},{"hash":"11111111010011111111101000100111111110000110001111111100001100111010111010000011001111011000110111111000001100111011001011001111111100111101111","time":62.91833333333334},{"hash":"11111111010011111111101000100111111110000110001111111100001100111010111010000011001111011000110111111000001100111011001011001111111100111101111","time":62.96},{"hash":"11111111010011111111101000100111111110000110001111111100001100111010110010000001001111011000110111111000001101111011001011001111111100111111111","time":63.001666666666665},{"hash":"11111111010011111111101000100111111110000110001111111100001100011010110010000001001111011000100111111000001101111011001010001111111100111101111","time":63.04333333333334},{"hash":"11111111010011111111101000100111111110000110001111111100001100011010111010000001001111011001100111111000001101111011001010101111111100111101111","time":63.085},{"hash":"11111111010001111111101000100111111110000110001111111100001100011010111010001001001111011001100111111000001101111011001010001111111100111111111","time":63.126666666666665},{"hash":"11111111010001111111001000100111111110000110001111111100001100011010110010001001001111011001100111111000101100111011001010001111111100111011111","time":63.16833333333334},{"hash":"11111111011001111111001000100111111110000110000111111100001100011010110010001101001111011001100111111000100100111011001010101111111100111011111","time":63.21},{"hash":"11111111011001111111001000100011111110000110000111111100001100011010110010000101001111011001100111111000100100111011001010101111111100111011111","time":63.251666666666665},{"hash":"11111111011001111111001000100011111110000110000111111100011100011011110010000101001111011001100111111000100110111011001010101111111100111111111","time":63.29333333333334},{"hash":"11111111011001111111011000100011111110000110000111111100011000011111110010000101001111011001100111111001100110111011001010101111111100111101111","time":63.335},{"hash":"11111111011001111111011000100011111110000110000111111100011000011111110010000101001111011001100111111001100110111011001010101111111100111110111","time":63.376666666666665},{"hash":"11111111111001111111011000100011111110000100000111111100011000011111110010000101001111011001100111111001100110111011001010101111111100111110111","time":63.41833333333334},{"hash":"11011111111001111111011000100011111110000100000111111100011000011111110010000101001111011001100111111001100110111011001010101111111100111010111","time":63.46},{"hash":"11011111111001111111011000100011111100000100000111111100011000011111110010000101011111011001100111111001100110111011001010100111111100111010111","time":63.501666666666665},{"hash":"11011111111001111111011001100011111100000100000111111100011000010111110010000101011111011001100111111001100110111011001010100111111100111010111","time":63.54333333333334},{"hash":"11011111111001111111011001100011111100000100000111111100011000010111110010000101011111011001100111111001100110011011001010100111111100111110111","time":63.585},{"hash":"11011110111001111111011001100011111100000100000111111100011000010111110010000101011111011001100111111001110110011011001010100111111100111110111","time":63.626666666666665},{"hash":"11111110111001111111011001100011111110000100000111111100011000010111110010001101011111011001100111111001110110011011001010100111111100111110111","time":63.66833333333334},{"hash":"11011110111001111111011001100011111110001100000111111100011000010111110010001101011111011001100111111001100110011011001010100111111100111110111","time":63.71},{"hash":"11011110111001111111011001100011111110001100000111111100011000010111110010001101011111011001100111111001100110011011001010100111111100111110111","time":63.751666666666665},{"hash":"11111110111001111111011001100011111110001100000111111100011000010111110010001101011111011001100111111001100110011011001010100111111100111110111","time":63.79333333333334},{"hash":"11011110111001111111011001100011111110001100000111111100011000010111110010001101011111011001100111111001100110011011001010100111111100111110111","time":63.835},{"hash":"11111110111001111111011001100011111110001100000111111100011000010110110010001101011111011001100111111001100110011011001010100111111100111110111","time":63.876666666666665},{"hash":"11111110111001111111011001100011111110001100000111111100011000010110110010001101011111011001100111111001100110011011001010100111111100111110111","time":63.91833333333334},{"hash":"11111110111001111111011001100011111110001100000111111100011000010110110010001101011111011001100111111000100110111011001010101111111100111110111","time":63.96},{"hash":"11111110111001111111010001100011111110001100000111111100001000010110110010001101011111011001100111111000001100111011001010101111111100111110111","time":64.00166666666667},{"hash":"11101110111001111111010001000011111110001100000111111100001000010110110010001101011111011001100111111000001100111011001110100111111100111110111","time":64.04333333333334},{"hash":"11101110011000111111010001000011111110000110000111111100001000010110110010011101011110011001100111111000101001111111001110100111111100111100111","time":64.08500000000001},{"hash":"11100110011000111111010001000011111110000110000111111100001000010110110010011101111110011001100111111000101001111111001110100111111100111100111","time":64.12666666666667},{"hash":"11100110011000111111010001000011111110000110000111111100001000010110110010011101111110011001100111111000100101111111001110100111111100111110111","time":64.16833333333334}]
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

//ffmpeg.setFfmpegPath(ffmpegPath);



// Compute opensubtitles compliant hash and filesize
//https://trac.opensubtitles.org/projects/opensubtitles/wiki/HashSourceCodes
function parse_input_file ( file ){
  return get_filesize( file ).then( function ( filesize ) {
    return new Promise( function (resolve, reject) {
      var oSub = new openSubtitles()
      oSub.computeHash( file, function ( err, hash ) {
        var title = title_from_filename( file )
        resolve({hash:hash,filesize:filesize+"",estimated_title:title})
      })
    })
  })
}


// Ask server for film information
function search_film( hash, bytesize, title, imdbid ) {
  return get( "http://fcinema.org/api", { action:"search", filename:title, imdb_code:imdbid, hash:hash, bytesize:bytesize }, true )
}



// Get the exact times {start,end} of a scene based on hash reference and helped by approx times
function get_scene_exact_times ( input, approx_start, approx_end, reference ) {
  console.log( "get_offset_with_reference called")
  input = "/home/miguel/videoLab/0/Homeland.S03E01.mkv"
  approx_end = 60
  approx_start = 64
  reference = default_reference;
  // Find the offset for the start
  return get_point_offset( input, approx_start, 2, reference )
    // Once we have the start, find the offset for the end (99.9% of the times will be at approx_end-(approx_start-exact_start) but who knows)
    .then( function ( exact_start ) { 
      console.log( "exact start at ", exact_start )
      return get_point_offset( input, approx_end-(approx_start-exact_start), 2, reference )
      // Once we have the start and the end times, return the values {start:ss.mmm,end:ss.mmm}
      .then( function ( exact_end ) { 
        console.log( "exact start at ",exact_start," exact end at ",exact_end )
        return { start:exact_start, end:exact_end }
      })
    })
}



function get_point_offset ( input, time, span, reference ) {
  console.log( "get_point_offset called with: ", input, time, span )
  return get_sync_reference( input, time-span/2, time+span/2 )
    .then( function ( this_version ) {
      var exact_time = crosscorrelate( reference, this_version, span )
      console.log( exact_time )
      if ( Math.abs(exact_time.max - exact_time.min ) < 0.2  && exact_time.center != null) {
        return exact_time.center
      } else if ( span < 256 ) {
        return get_point_offset( input, time, span*4, reference )
      } else {
        return "Unable to find offset, sorry mate"
      }
    })
}



// Perform crosscorrelation operation to find a our clip inside a ref clip
function crosscorrelate( ref, our, span ){
  console.log("crosscorrelate called with: span=",span,"; ref.length=",ref.length,"; our.length=",our.length)
// Set parameters    
  var accuracy   = 1/24; // group offsets closer than 'accuracy'
  var count_min  = 30;   // ignore noisy offsets with few points

// Crosscorrelate
  var d_array = {};
  var d_count = {};
  for (var o = our.length - 1; o >= 0; o--) {
    for (var r = ref.length - 1; r >= 0; r--) {
    // Compute time offset and hamming_distance
      var t = ref[r].time - our[o].time;
      var d = hamming_distance( ref[r].hash, our[o].hash )
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
// Fake inputs TODO: remove this ;)
  var input  = "/home/miguel/videoLab/0/Homeland.S03E01.mkv"
  var output = "/home/miguel/videoLab/test.mp4"
  var player = "smplayer"
  var filters= [{start:3.21,end:10.42},{start:13.21,end:20.42},{start:23.21,end:40.42}]

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
    var path = which.sync( player ) // todo make async
    spawn( path )
    //spawn("ffmpeg",["-re","-i",input,"-vf",vf,"-af",af,output],{stdio:"ignore"});
    //ffmpeg -re -i $file -q:v 3 -q:a 3 -f mpegts udp://127.0.0.1:2000
  };
  return 0;
}

function preview ( input, filter ) {
// Remove all but few seconds around scene
  filters = [filter,{start:filter.start-3,end:filter.end+3}]
// Create skip filters
  var vf = create_ffmpeg_filter( "vf", filters )
  var af = create_ffmpeg_filter( "af", filters )
// Play in ffplayer
  spawn("ffplay",["-i",input,"-vf",vf,"-af",af],{stdio:"ignore"});

  return 0;
}

function get_current_time (){
  return 9.235;
}

function get_thumbnails ( input, start, end, fps, usage ) {
  console.log("get_thumbnails called with ",input, start, end, fps, usage )
  // Fake input
  /*var start = 53.21
  var end   = 85.42
  var input = "/home/miguel/videoLab/0/Homeland.S03E01.mkv"
  var usage = "sync"*/

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
          thumbs.push( { time : start+i/fps , file : tmpFolder+"/thumb"+pad(i+1,4)+".png" } )
        };
        resolve( thumbs )
      } else{
        reject( code )
      };
    });
  })
}


// Generate thumbails and return their hash
function get_sync_reference ( input, start, end ) {
  console.log("get_sync_reference called with ", input, start, end )
  /*var start = 60.21
  var end   = 64.21
  var input = "/home/miguel/videoLab/0/Homeland.S03E01.mkv"*/
  return get_thumbnails( input, start, end, 24, "sync" ).then( function ( thumbs ) {
    return Promise.all(
      thumbs.map( create_thumbnail_hash )
    )
  })
}




function create_thumbnail_hash ( thumb ) {
  return new Promise( function (resolve, reject) {
    get_pixels( thumb.file, function(err, pixels) {
      if ( err ) {
        resolve("")
      } else {
        var hash = ""
        for (var i = 4, data = pixels.data; i < data.length; i+=4) {
          hash += ( (data[i-4]>data[i])? 0 : 1 )
        };
        resolve( {hash:hash,time:thumb.time} )
      }
    })
  })
}


function hamming_distance ( a, b ) {
  var av = a.split("")
  var bv = b.split("")
  var distance = 0;
  for (var i = av.length - 1; i >= 0; i--) {
    if( av[i] != bv[i] ) distance++
  };
  return distance;
}

//console.log( parseInt(hash.join(""), 2).toString('hex') )
    /*var buffer = new Buffer( hash );
    var toBase64 = buffer.toString('base64');
    console.log( hash, toBase64 )    */




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




// GET method as a promise
function get( url, params, json ) {
  var str = [];
  for(var key in params) if(params[key]) str.push( key + "=" + params[key] );
  if( str.length != 0 )url = url+"?"+str.join("&")

  return new Promise(function(resolve, reject) {
    httpRequest( url, function(error, response, body) {
      if( error ){
        reject( "Network Error" )
      } else if ( json ) {
        resolve( JSON.parse( body ) )
      } else{
        resolve( body )
      }
    });
  });
}


// Expose functions
exports.get_id_from_file          = parse_input_file;
exports.get_content_by_id         = search_film;
exports.get_offset_with_reference = get_scene_exact_times;
exports.get_available_players     = get_available_players;
exports.play                      = play;
exports.preview                   = preview;
exports.get_current_time          = get_current_time;
exports.get_thumbnails            = get_thumbnails
exports.get_sync_reference        = get_sync_reference;
