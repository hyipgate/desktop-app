angular.module('MainService', ['ngCookies'])

.factory('service', ['$http', '$q', '$cookies', function($http, $q, $cookies) {
  "use strict";

  var MainFactory = {};
  var data = {};
  var scenes = [];
  var searchQuery;
  var mode = false;
  var syncRef = []

  function random_id () {
    var text     = ""
    var possible = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
    for (var i = 0; i < 10; i++) {
      text += possible.charAt( Math.floor( Math.random() * possible.length ));
    };
    return text;
  }

  MainFactory.setMode = function(new_mode){
    mode = new_mode;
  }

  MainFactory.getMode = function(){
    return mode;
  }

  MainFactory.getTags = function() {
    var tags = [
      { 'type': 'Sex', 'name': 'Nudity' },
      { 'type': 'Sex', 'name': 'Implicit sex' },
      { 'type': 'Sex', 'name': 'Explicit sex' },

      { 'type': 'Violence', 'name': 'Shooting' },
      { 'type': 'Violence', 'name': 'Blood' },
      { 'type': 'Violence', 'name': 'Nudiy' },

      { 'type': 'Profanity', 'name': 'Shooting' },
      { 'type': 'Profanity', 'name': 'Blood' },
      { 'type': 'Profanity', 'name': 'Nudiy' },
    ];
    return tags;
  }

  MainFactory.removeScene = function ( id ) {
    console.log( scenes )
    scenes.splice( id, 1 )
    console.log( scenes )
  }

  MainFactory.addScene = function( start = -1, end = -1, tags = [], comment = "" ) {
    console.log("add scene")
    var scene = {
      id:       random_id(),
      tags:     tags,
      comment:  comment,
      start:    start,
      end:      end
    }
    scenes.push( scene )
    return (scenes.length-1)
  }

  MainFactory.updateScene = function( id, scene ) {
    scenes[id] = scene
  }

  MainFactory.getScenes = function () {
    return scenes
  }

  MainFactory.saveSelectedFilm = function(filmData){
    console.log("save film")
  	syncRef   = filmData.syncRef || {} // important {} and not []
    data.film = filmData;
    if ( !filmData.scenes ) return
    scenes.splice( 0, scenes.length )
    for (var i = 0; i < filmData.scenes.length; i++) {
      scenes[i] = filmData.scenes[i]
    }
  }

  MainFactory.getSyncRef = function () {
    return syncRef;
  }

  MainFactory.setSyncRef = function ( ref ) {
    syncRef = ref;
  }

  MainFactory.getSelectedFilm = function(){
  	return data.film;
  }

  MainFactory.saveSearchQuery = function(query){
  	searchQuery = query;
  }

  MainFactory.getSearchQuery = function(){
  	return searchQuery;
  }

  return MainFactory;

}]);