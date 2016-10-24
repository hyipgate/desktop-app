//Add fcinema code here


var list = {"IDs":["tt5237706","tt5237714","tt5255582","tt5255590","tt5257872","tt5257920","tt5257962","tt5258034","tt5258124","tt5258146"],"Titles":["Eighteen Years Lost","Turning the Tables","Plight of the Accused","Indefensible","The Last Person to See Teresa Alive","Testing the Evidence","Framing Defense","The Great Burden","Lack of Humility","Fighting for Their Lives"],"Directors":[null,null,null,null,null,null,null,null,null,null],"Season":[1,1,1,1,1,1,1,1,1,1],"Episode":["1","2","3","4","5","6","7","8","9","10"],"Released":["2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18","2015-12-18"],"ImdbRating":["8.4","8.7","8.9","9.2","9.1","8.6","8.6","8.7","9.3","8.8"],"ImdbCode":"tt5189670"}
var film = {"ImdbCode":"tt0944943","Title":"DUPE","Director":"Kjell-\u00c5ke Andersson","PGCode":null,"ImdbRating":"5.9","Released":"05 Nov 2007","Actors":"Krister Henriksson, Johanna S\u00e4llstr\u00f6m, Ola Rapace, Ellen Mattsson","Writers":null,"Plot":"Tracking a sadistic killer, detective Kurt Wallander follows a string of incidents -- attacks on domestic animals, ritualistic murders of humans -- with help from his daughter, Linda, a new member of the Ystad police force.","Runtime":"89 min","Genre":"Crime, Drama, Mystery","Awards":null,"Poster":"http:\/\/ia.media-imdb.com\/images\/M\/MV5BMTc0MTc0MTQxMF5BMl5BanBnXkFtZTcwMjI0MjA0MQ@@._V1_SX300.jpg","Scenes":[],"SeriesID":"tt0907702","Message":"New version"}

function get_id_from_file ( path ){
  return film;
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

function play ( path, player, filters, output ) {
  var fffilter = create_ffmpeg_filter( filters )

  if( player == "ffplay" ){

  } else if ( player == "file" ) {

  } else {

  };
  return 0;
}

function preview ( path ) {
  return 0;
}

function get_current_time (){
  return 9.235;
}

function get_thumbnails ( path, start, end ) {
  var thumbs = [ { time:2.36, file:"/thumb1.png" }, { time:7.36, file:"/thumb2.png" }, { time:5.36, file:"/thumb3.png" }];
  return thumbs;
}

function get_sync_reference ( path, start, end ) {
  var ref = ["a23365","2e8d6e","2856da","5e89d5"];
  return ref;
}




function create_ffmpeg_filter ( times ) {
  /* http://stackoverflow.com/q/39122287/3766869 by Mulvya
    ffplay
      -vf "select='lte(t\,4)+gte(t\,16)',setpts=N/FRAME_RATE/TB"
      -af "aselect='lte(t\,4)+gte(t\,16)',asetpts=N/SR/TB"
      -i INPUT*/
  var filter = [];
  for (var i = 0; i < times.length; i++) {
    filter.push("lte(t\,"+times[i].start+")"+"gte(t\,"+times[i].end+")")
  }
  return filter.join("*")
  

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