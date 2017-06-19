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
        { 'skip': false, 'list': true, 'type': 'Sex', 'name': 'rape' },
        { 'skip': false, 'list': true, 'type': 'Sex', 'name': 'pornographic magazine' },
        { 'skip': false, 'list': true, 'type': 'Sex', 'name': 'art nudity' },
        { 'skip': false, 'list': true, 'type': 'Sex', 'name': 'topless male' },
        { 'skip': false, 'list': true, 'type': 'Sex', 'name': 'topless female' },
        { 'skip': false, 'list': true, 'type': 'Sex', 'name': 'full nudity male' },
        { 'skip': false, 'list': true, 'type': 'Sex', 'name': 'full nudity female' },
        { 'skip': false, 'list': true, 'type': 'Sex', 'name': 'explicit sex' },
        { 'skip': false, 'list': true, 'type': 'Sex', 'name': 'implied sex' },
        { 'skip': false, 'list': true, 'type': 'Sex', 'name': 'kissing peck' },
        { 'skip': false, 'list': true, 'type': 'Sex', 'name': 'kissing passionate' },
        { 'skip': false, 'list': true, 'type': 'Sex', 'name': 'sexually charged scene' },

        { 'skip': false, 'list': true, 'type': 'Violence', 'name': 'punching' },
        { 'skip': false, 'list': true, 'type': 'Violence', 'name': 'torture' },
        { 'skip': false, 'list': true, 'type': 'Violence', 'name': 'violent accident' },
        { 'skip': false, 'list': true, 'type': 'Violence', 'name': 'open wounds' },
        { 'skip': false, 'list': true, 'type': 'Violence', 'name': 'killing' },
        { 'skip': false, 'list': true, 'type': 'Violence', 'name': 'hand gesture' },
        { 'skip': false, 'list': true, 'type': 'Violence', 'name': 'explosion' },
        { 'skip': false, 'list': true, 'type': 'Violence', 'name': 'battle' },
        { 'skip': false, 'list': true, 'type': 'Violence', 'name': 'agony' },
        { 'skip': false, 'list': true, 'type': 'Violence', 'name': 'dead body' },
        { 'skip': false, 'list': true, 'type': 'Violence', 'name': 'bulliying' },

        { 'skip': false, 'list': true, 'type': 'Others', 'name': 'initial/closing credings' },
        { 'skip': false, 'list': true, 'type': 'Others', 'name': 'euphemized profanities' },
        { 'skip': false, 'list': true, 'type': 'Others', 'name': 'deity improper use' },
        { 'skip': false, 'list': true, 'type': 'Others', 'name': 'deity insult' },
        { 'skip': false, 'list': true, 'type': 'Others', 'name': 'alcohol' },
        { 'skip': false, 'list': true, 'type': 'Others', 'name': 'smoking' },
        { 'skip': false, 'list': true, 'type': 'Others', 'name': 'smoking illegal drug' },
        { 'skip': false, 'list': true, 'type': 'Others', 'name': 'drug injection' },
        { 'skip': false, 'list': true, 'type': 'Others', 'name': 'frightening/startling scene/event' },
    ]
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