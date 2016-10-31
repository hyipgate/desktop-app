angular.module('mainCtrl', ['ngMaterial'])

.controller('MainController', function($rootScope, $scope) {
  var vm = this;

  $rootScope.electron = require('electron');
  $rootScope.utils = $rootScope.electron.remote.require('./utils');
  $rootScope.db = new PouchDB('localData');

  vm.get_id_from_file = function(){
    var data = $rootScope.utils.get_id_from_file('text');
    console.log(data);
  }

  vm.get_content_by_id = function(){
    var data = $rootScope.utils.get_content_by_id(0);
    console.log(data);
  }

  vm.get_offset_with_reference = function(){
    var data = $rootScope.utils.get_offset_with_reference('path', 'guess', 'reference');
    console.log(data);
  }

  vm.get_available_players = function(){
    var data = $rootScope.utils.get_available_players();
    console.log(data);
  }

  vm.play = function(){
    var data = $rootScope.utils.play('path', 'player', 'filters', 'output');
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

});
