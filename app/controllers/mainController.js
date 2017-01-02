angular.module('mainCtrl', ['ngMaterial'])

.controller('MainController', function($rootScope, $scope, service, $location, $window, $q) {
  var vm = this;
  vm.processing = false;

  $rootScope.electron = require('electron');
  $rootScope.utils = $rootScope.electron.remote.require('./utils');
  $rootScope.db = new PouchDB('localData');

  vm.getFile = function(event){
    vm.processing = true;
    var file = event.target.files;
    if(file){
      vm.search_film(file[0].path).then(function(film){
        vm.processing = false;
        film = film["data"];
        if(film.IDs){
          console.log('Lista');
        }else{
          service.saveSelectedFilm(film);
          $location.path('/film');
          $rootScope.electron.remote.getCurrentWindow().setSize(1190,680,true);
          if (!$rootScope.$$phase) $rootScope.$apply();
        }
      })
    }else{
      console.log('ERROR');
    }
  };

  vm.search_film = function(text){
    return $rootScope.utils.search_film(text);
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
