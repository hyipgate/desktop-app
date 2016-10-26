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
      vm.get_id_from_file(file[0].path).then(function(guess){
        $rootScope.utils.get_content_by_id(guess.hash, guess.filesize, guess.estimated_title,null).then(function(film){
          vm.processing = false;
          if(film.IDs){
            console.log('Lista');
          }else{
            service.saveSelectedFilm(film);
            $location.path('/film');
            console.log($rootScope.electron.remote.getCurrentWindow());
            $rootScope.electron.remote.getCurrentWindow().setSize(1190,680,true);
            if (!$rootScope.$$phase) $rootScope.$apply();
          }
        });
      })
    }else{
      console.log('ERROR');
    }
  };

  vm.get_id_from_file = function(text){
    return $rootScope.utils.get_id_from_file(text);
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

  vm.preview = function(){
    var data = $rootScope.utils.preview();
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

});
