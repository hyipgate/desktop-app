angular.module('MainService', ['ngCookies'])

.factory('service', ['$http', '$q', '$cookies', function($http, $q, $cookies) {
  "use strict";

  var MainFactory = {};
  var searchQuery;


  MainFactory.saveSearchQuery = function(query){
  	searchQuery = query;
  }

  MainFactory.getSearchQuery = function(){
  	return searchQuery;
  }

  return MainFactory;

}]);