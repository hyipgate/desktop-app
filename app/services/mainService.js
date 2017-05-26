angular.module('MainService', ['ngCookies'])

.factory('service', ['$http', '$q', '$cookies', function($http, $q, $cookies) {

  var MainFactory = {};
  var data = {};
  var searchQuery;

  MainFactory.saveSelectedFilm = function(filmData){
  	data.film = filmData;
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