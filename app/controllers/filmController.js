angular.module('filmCtrl', ['ngMaterial'])

.controller('FilmController', function($rootScope, $scope, service, $location, $mdBottomSheet, $mdDialog) {
  var vm = this;
  
  vm.getMovie = function(){
    vm.movieData = service.getSelectedFilm();
  }

  vm.getMovie();

  vm.css = {
   'background': 'linear-gradient( rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('+vm.movieData.images.backdrops[0]+') no-repeat center center',
   'background-size': 'cover',
  }

  vm.showListBottomSheet = function() {
    $scope.alert = '';
    $mdBottomSheet.show({
      templateUrl: 'views/bottom-sheet-list-template.html',
      controller: 'FilmController as film'
    }).then(function(clickedItem) {
      console.log(clickedItem + ' clicked!');
    });
  };

  vm.listItemClick = function($index) {
    var clickedItem = vm.players[$index];
    $mdBottomSheet.hide(clickedItem);
  };


  vm.players = ["Netflix","Amazon Video"] //TODO: this should be in the movie data



  $scope.editScene = function(id,$event) {
    $mdDialog.show({
      targetEvent: $event,
      template:
        '<md-dialog>' +
        ' <md-dialog-content>'+
        '<label>Start:</label><input type="text" ng-model="scene.start" placeholder="ms"/><br>'+
        '<label>End:</label><input type="text" ng-model="scene.end" placeholder="ms"/><br>'+
        '<label>Comment:</label><input type="text" ng-model="scene.comment" placeholder="Brief comment"/><br>'+
        '</md-dialog-content>' +
        '  <md-dialog-actions>' +
        '    <md-button>Preview</md-button>' +
        '    <md-button ng-click="closeDialog()" class="md-primary">Finish</md-button>' +
        '  </md-dialog-actions>' +
        '</md-dialog>',
      locals: { id: id },
      controller: ['$scope', 'id', function($scope, id) {
        $scope.scene = vm.movieData.scenes[id];
        $scope.closeDialog = function() {
          $mdDialog.hide();
        }
      }]
    })
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
