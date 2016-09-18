angular.module('mainCtrl', ['ngMaterial'])

.controller('MainController', function($rootScope, $scope) {
  var vm = this;

  $rootScope.electron = require('electron');
  $rootScope.utils = $rootScope.electron.remote.require('./utils');
  $rootScope.db = new PouchDB('localData');

});
