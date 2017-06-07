angular.module('streamCtrl', ['ngMaterial'])

.controller('StreamController', function($rootScope, $scope, service, $location, $mdDialog ) {
  var vm = this;
  
   // Listen keyboard events 
  window.onkeyup = function(e) {
     var key = e.keyCode ? e.keyCode : e.which;
     if ( key == 110 ) {
        var scene = mark_current_time()
        if ( scene ) {
          var index = service.addScene( scene.start, scene.end )
          $scope.main.editScene( index )
        }
     }
  }

  $scope.backToFilm = function (argument) {
    window.onkeyup = null
    $location.path('/film');
  }



  $scope.sceneList = function($event) {
    pause(true)
    $mdDialog.show({
      targetEvent: $event,
      locals: { editScene: $scope.main.editScene },
      templateUrl: 'views/scene-list-template.html',
      controller: sceneListController
    })
    
    function sceneListController ($scope, $mdDialog, editScene ) {

      $scope.scenes  = service.getScenes();

      $scope.closeAndEditScene = function ($index, $event) {
        $mdDialog.hide()
        editScene( $index)
      }

      $scope.newScene = function () {
        var index = service.addScene()
        editScene( index )
      }
    }
  }

}).filter('minutes', function() {
  return function( input ) {
    input = input || 0;
    return Math.floor(input/60)
  };
}).filter('time', function() {
  return function(start, end) {
    return Math.floor(end-start)
  };
}).filter('tags', function() {
  return function( input ) {
    return input.join(", ")
  };
})
