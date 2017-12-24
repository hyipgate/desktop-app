angular.module('chooseFilmCtrl', ['ngMaterial'])

    .controller('ChooseFilmTableController', function($rootScope, $scope, service, $location, $window, $q) {
        var vm = this;
        vm.processing = false;

        $rootScope.electron = require('electron');

        vm.getMovie = function() {
            vm.movieData = $rootScope.movieData //service.getSelectedFilm();
        }

        vm.searchId = function(id) {
            vm.processing = true;
            $rootScope.utils.search_film(null, null, null, id).then(function(film) {
                if (vm.processing == false) return console.log("[selected] reply already parsed...")
                vm.processing = false;
                $rootScope.setFilm(film.data);
                if (film.data.type == "list") {
                    vm.movieData = film.data
                } else {
                  $location.path('/film');
                }
                $rootScope.$apply();
            });
        }

        vm.getMovie();

    });