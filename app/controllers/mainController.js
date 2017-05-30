angular.module('mainCtrl', ['ngMaterial'])

.controller('MainController', function($rootScope, $route, $scope, service, $location, $window, $q) {
  var vm = this;
  vm.processing = false;
  vm.searchQuery;
  vm.beforeConfig;

  vm.searchQuery = service.getSearchQuery();

  $rootScope.electron = require('electron');
  $rootScope.utils = $rootScope.electron.remote.require('./app/assets/js/utils');

  $scope.openSettings = function () {
    var openTab = $location.path()
    if ( openTab != "/config") {
      vm.beforeConfig = openTab;
      $location.path('/config');
    } else {
      $location.path(vm.beforeConfig);
    }
    
  }

  vm.getFile = function(event){
    vm.processing = true;
    var file = event.target.files;
    if(file){
      vm.search_film(file[0].path,null).then(function(film){
        vm.processing = false;
        film = film["data"];
        if(film.type=="list"){
          service.saveSelectedFilm(film);
          service.saveSearchQuery(vm.searchQuery);
          $location.path('/chooseFilmTable');
          if (!$rootScope.$$phase) $rootScope.$apply();
        }else{
          service.saveSelectedFilm(film);
          $location.path('/film');
          if (!$rootScope.$$phase) $rootScope.$apply();
        }
      })
    }else{
      console.log('ERROR');
    }
  };

  vm.searchTitle = function(){
    vm.processing = true;
      vm.search_film(null,vm.searchQuery).then(function(film){
        vm.processing = false;
        film = film["data"];
        if(film.type=="list"){
          service.saveSelectedFilm(film);
          service.saveSearchQuery(vm.searchQuery);
          $location.path('/chooseFilmTable');
                    console.log(film);
                    $route.reload();
          if (!$rootScope.$$phase) $rootScope.$apply();
        }else{
          console.log(film);
          service.saveSelectedFilm(film);
          $location.path('/film');
          if (!$rootScope.$$phase) $rootScope.$apply();
        }
      });
  };

  vm.selected = function(imdbid){
    $rootScope.utils.search_film(null,null,null,imdbid).then(function(film){
      console.log(film);
      service.saveSelectedFilm(film.data);
      $location.path('/film');
      if (!$rootScope.$$phase) $rootScope.$apply();
    });
  }

  vm.search_film = function(filepath,title){
    //return $rootScope.utils.search_film(text);
    return $rootScope.utils.search_film(filepath,title,null,null);
  }

  vm.get_content_by_id = function(){
    var data = $rootScope.utils.get_content_by_id(0);
    console.log(data);
  }

  vm.get_offset_with_reference = function(){
    var data = $rootScope.utils.get_offset_with_reference('path', 'guess', 'reference');
    console.log(data);
  }

  vm.play = function(){
    var data = $rootScope.utils.play('path', 'player', 'filters', 'output');
    console.log(data);
  }

  vm.test = function(){
    var data = $rootScope.utils.test();
    console.log(data);
  }

  vm.preview = function(){
    var data = $rootScope.utils.preview('path','filter');
    console.log(data);
  }

  vm.get_current_time = function(){
    var data = $rootScope.utils.get_current_time();
    console.log(data);
  }

  vm.get_thumbnails = function(){
    var data = $rootScope.utils.get_thumbnails('path', 'start', 'end');
    console.log(data);
  }

  vm.get_sync_reference = function(){
    var data = $rootScope.utils.get_sync_reference('path', 'start', 'end');
    data.then( function( ref ) { console.log(JSON.stringify(ref)) } )  
    console.log(data);
  }

  var startScreenshoting;
  vm.netflix = function(){
    startScreenshoting = Date.now() 
    var cb = function () { console.log( Date.now() -startScreenshoting) }
    var remote = require('electron').remote
    remote.getCurrentWindow().capturePage(function handleCapture (img) {
      remote.require('fs').writeFile("test", img.toPng(), cb)
    })

    console.log("loading netflix")
    $location.path('/netflix');
  }

});
