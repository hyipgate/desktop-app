angular.module('filmCtrl', ['ngMaterial'])

.controller('FilmController', function($rootScope, $scope, service, $location, $mdBottomSheet) {
  var vm = this;

  console.log($rootScope.electron);
  
  vm.getMovie = function(){
    vm.movieData = service.getSelectedFilm();
  }

  vm.getMovie();

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

  vm.get_available_players = function(){
    vm.players = $rootScope.utils.get_available_players();
  }

  vm.get_available_players();

});