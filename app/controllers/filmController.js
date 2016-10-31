angular.module('filmCtrl', ['ngMaterial'])

.controller('FilmController', function($rootScope, $scope, service, $location, $mdBottomSheet) {
  var vm = this;

  console.log($rootScope.electron);
  
  vm.getMovie = function(){
    vm.movieData = service.getSelectedFilm();
  }

  vm.getMovie();

  vm.css = {
   'background': 'linear-gradient( rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('+vm.movieData.Backdrop+') no-repeat center center',
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

  vm.get_available_players = function(){
    $rootScope.utils.get_available_players().then(function(data){
      console.log(data);
      vm.players = data;
    });
  }

  vm.get_available_players();

});