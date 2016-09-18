angular.module('mainCtrl', ['ngMaterial'])

.controller('MainController', function($scope) {
  var vm = this;

  var electron = require('electron');
  var testRes = electron.remote.require('./utils').myTest;
  console.log(testRes());

});
