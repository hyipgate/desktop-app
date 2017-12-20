angular.module('chooseFilmCtrl', ['ngMaterial'])

.controller('ChooseFilmTableController', function($rootScope, $scope, service, $location, $window, $q) {
  var vm = this;
  vm.processing = false;

  $rootScope.electron = require('electron');

  vm.getMovie = function(){
    vm.movieData = $rootScope.movieData//service.getSelectedFilm();
  }

  vm.selected = function(imdbid){
    vm.processing = true;
    $rootScope.utils.search_film(null,null,null,imdbid).then(function(film){
      if (vm.processing == false ) return console.log("[selected] reply already parsed...")
      vm.processing = false;
      $rootScope.setFilm(film.data);
      $location.path('/film');
      if (!$rootScope.$$phase) $rootScope.$apply();
    });
  }

  vm.getMovie();

});
