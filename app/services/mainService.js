angular.module('MainService', ['ngCookies'])

.factory('service', ['$http', '$q', '$cookies', function($http, $q, $cookies) {

  var MainFactory = {};
  var data = {};

  MainFactory.saveSelectedFilm = function(filmData){
  	data.film = filmData;
  }

  MainFactory.getSelectedFilm = function(){
  	return data.film;
  }

  return MainFactory;

}]);