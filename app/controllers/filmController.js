angular.module('filmCtrl', ['ngMaterial'])

.controller('FilmController', function($rootScope, $scope, service, $location, $mdBottomSheet, $mdDialog) {
  var vm = this;

  vm.editor = "none";
  
  vm.getMovie = function(){
    vm.movieData = service.getSelectedFilm();
    vm.movieData.providers = [] // TODO do this in the API
    vm.providers = vm.movieData.providers
    vm.providers.push( { name:"File/DVD", url:"file", icon: './assets/img/file.svg'} )
    vm.providers.push( { name:"Amazon", url:"file", icon: './assets/img/amazon-instant-video.jpe'} )
    vm.providers.push( { name:"Netflix", url:"file", icon: './assets/img/netflix.jpe'} )
    //vm.providers.push( { name:"Itunes", url:"file", icon: './assets/img/apple-itunes.jpe'} )
    vm.providers.push( { name:"Google Play", url:"file", icon: './assets/img/google-play-movies.jpe'} )

    vm.movieData.tags = []
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
    var clickedItem = vm.movieData.providers[$index]
    $mdBottomSheet.hide(clickedItem.name);
    service.saveSelectedFilm(vm.movieData);
    $location.path('/stream');
    if (!$rootScope.$$phase) $rootScope.$apply();
    var edit = vm.editor != "none";
    load_film( clickedItem.url, vm.movieData, edit )
  };

  $scope.backToSearch = function (argument) {
    $location.path('/select');
  }


  $scope.editScene = function(id,$event) {
    $mdDialog.show({
      targetEvent: $event,
      templateUrl: 'views/edit-scene-template.html',
      locals: { id: id },
      controller: ['$scope', 'id', function($scope, id) {
        $scope.scene = vm.movieData.scenes[id];
        $scope.selectedItem = null;
        $scope.searchText = null;
        $scope.tags = loadTags();
        $scope.selectedTags = vm.movieData.scenes[id].tags;

        /* Search tags */
        $scope.querySearch = function (query) {
          var results = query ? $scope.tags.filter(createFilterFor(query)) : [];
          return results;
        }

        /* Create filter function for a query string */
        function createFilterFor(query) {
          var lowercaseQuery = angular.lowercase(query);

          return function filterFn(tag) {
            return (tag._lowername.indexOf(lowercaseQuery) === 0) ||
                (tag._lowertype.indexOf(lowercaseQuery) === 0);
          };

        }

        function loadTags() {
          var tags = [
            { 'type': 'Sex', 'name': 'Nudity' },
            { 'type': 'Sex', 'name': 'Implicit sex' },
            { 'type': 'Sex', 'name': 'Explicit sex' },

            { 'type': 'Violence', 'name': 'Shooting' },
            { 'type': 'Violence', 'name': 'Blood' },
            { 'type': 'Violence', 'name': 'Nudiy' },

            { 'type': 'Vocab.', 'name': 'Shooting' },
            { 'type': 'Vocab.', 'name': 'Blood' },
            { 'type': 'Vocab.', 'name': 'Nudiy' },
          ];

          return tags.map(function (tag) {
            tag._lowername = tag.name.toLowerCase();
            tag._lowertype = tag.type.toLowerCase();
            return tag;
          });
        }
        

        $scope.closeDialog = function() {
          $mdDialog.hide();
        }

        $scope.preview = function(argument) {
          $location.path('/stream');
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
