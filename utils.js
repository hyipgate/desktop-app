//Add fcinema code here


var list = {"IDs":["tt5237706","tt5237714","tt5255582","tt5255590","tt5257872","tt5257920","tt5257962","tt5258034","tt5258124","tt5258146"],"Titles":["Eighteen Years Lost","Turning the Tables","Plight of the Accused","Indefensible","The Last Person to See Teresa Alive","Testing the Evidence","Framing Defense","The Great Burden","Lack of Humility","Fighting for Their Lives"],"Directors":[null,null,null,null,null,null,null,null,null,null],"Season":[1,1,1,1,1,1,1,1,1,1],"Episode":["1","2","3","4","5","6","7","8","9","10"],"Released":["2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18"],"ImdbRating":["8.4","8.7","8.9","9.2","9.1","8.6","8.6","8.7","9.3","8.8"],"ImdbCode":"tt5189670"}
var film = {"ImdbCode":"tt0944943","Title":"#DUPE#","Director":"Kjell-\u00c5ke Andersson","PGCode":null,"ImdbRating":"5.9","Released":"05 Nov 2007","Actors":"Krister Henriksson, Johanna S\u00e4llstr\u00f6m, Ola Rapace, Ellen Mattsson","Writers":null,"Plot":"Tracking a sadistic killer, detective Kurt Wallander follows a string of incidents -- attacks on domestic animals, ritualistic murders of humans -- with help from his daughter, Linda, a new member of the Ystad police force.","Runtime":"89 min","Genre":"Crime, Drama, Mystery","Awards":null,"Poster":"http:\/\/ia.media-imdb.com\/images\/M\/MV5BMTc0MTc0MTQxMF5BMl5BanBnXkFtZTcwMjI0MjA0MQ@@._V1_SX300.jpg","Scenes":[],"SeriesID":"tt0907702"}


console.log("hey mate")
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const spawn = require("child_process").spawn;
const tmp = require('tmp');
ffmpeg.setFfmpegPath(ffmpegPath);


function get_id_from_file ( path ){
  return list;
}


function get_content_by_id ( id ) {
  return film;
}

function get_offset_with_reference ( path, guess, reference ) {
  var sync = { start: 5.232, end: 8.523 };
  return sync;
}

function get_available_players () {
  var players = ["ffplay","file","VLC","MPlayer"];
  return players;
}

function play ( input, player, filters, output ) {
// Fake inputs TODO: remove this ;)
  var input  = "/home/miguel/videoLab/0/Homeland.S03E01.mkv"
  var output = "/home/miguel/videoLab/test.mp4"
  var player = "file"
  var filters= [{start:3.21,end:10.42},{start:13.21,end:20.42},{start:23.21,end:40.42}]

// Create skip filters
  var vf = create_ffmpeg_filter( "vf", filters )
  var af = create_ffmpeg_filter( "af", filters )
 
// Perform requested actions  
  if( player == "ffplay" ){
    spawn("ffplay",["-i",input,"-vf",vf,"-af",af],{stdio:"ignore"});
  } else if ( player == "file" ) {
    spawn("ffmpeg",["-i",input,"-vf",vf,"-af",af,output],{stdio:"ignore"});
    //console.log( ffmpeg( input ).output( output ).run() )
  } else {

    //ffmpeg -re -i $file -q:v 3 -q:a 3 -f mpegts udp://127.0.0.1:2000

  };
  return 0;
}

function preview ( path ) {
  return 0;
}

function get_current_time (){
  return 9.235;
}

function get_thumbnails ( input, start, end, fps, usage ) {
  // Fake input

  var start = 53.21
  var end   = 55.42
  var input = "/home/miguel/videoLab/0/Homeland.S03E01.mkv"
  var usage = " "
 
 //ffmpeg -i $video_folder/video.mkv -pix_fmt gray -s $size -vf "select=1" -vsync vfr $frames_folder/thumb%04d.bmp
// Set default fps
  var fps = fps? fps : 25
  var nframes = Math.round( (end-start)*fps )
// Get tmp folder
  var tmpFolder = tmp.dirSync().name;
// Extract thumbails
  if( usage && usage == "sync"){
    spawn("ffmpeg",["-ss",start,"-i",input,"-vf","fps="+fps,"-pix_fmt","gray","-s","16x9","-vframes",nframes,tmpFolder+"/thumb%04d.bmp"])
  } else {
    spawn("ffmpeg",["-ss",start,"-i",input,"-vf","fps="+fps,"-s","160x90","-vframes",nframes,tmpFolder+"/thumb%04d.bmp"])
  }
  var thumbs = [];
  for (var i = 0; i < nframes; i++) {
    thumbs.push( { time : start+i/fps , file : tmpFolder+"/thumb"+pad(i,4)+".bmp" } )
  };
  return thumbs;
}

function get_sync_reference ( path, start, end ) {
  var ref = ["a23365","2e8d6e","2856da","5e89d5"];
  return ref;
}




function create_ffmpeg_filter ( stream, times ) {
  /* http://stackoverflow.com/q/39122287/3766869 by Mulvya
    ffplay
      -vf "select='lte(t\,4)+gte(t\,16)',setpts=N/FRAME_RATE/TB"
      -af "aselect='lte(t\,4)+gte(t\,16)',asetpts=N/SR/TB"
      -i INPUT*/
  var filter = [];
  for (var i = 0; i < times.length; i++) {
    filter.push("lte(t\,"+times[i].start+")"+"+gte(t\,"+times[i].end+")")
  }
  if ( stream == "vf") {
    return ("fps,select='"+filter.join("*")+"',setpts=N/FRAME_RATE/TB")
  } else if ( stream == "af") {
    return ("aselect='"+filter.join("*")+"',asetpts=N/SR/TB")
  } else {
    return filter.join("*")
  };
}


function pad(n, width, z) {
  //http://stackoverflow.com/a/10073788/3766869
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}





exports.get_id_from_file          = get_id_from_file;
exports.get_content_by_id         = get_content_by_id;
exports.get_offset_with_reference = get_offset_with_reference;
exports.get_available_players     = get_available_players;
exports.play                      = play;
exports.preview                   = preview;
exports.get_current_time          = get_current_time;
exports.get_thumbnails            = get_thumbnails
exports.get_sync_reference        = get_sync_reference;


console.log("hey mate finish loading")
