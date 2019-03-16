angular.module('chooseFilmCtrl', ['ngMaterial'])

    .controller('ChooseFilmTableController', function($rootScope, $scope, $location, $window, $q) {
        var vm = this;
        vm.processing = false;

        vm.getMovie = function() {
            vm.movieData = $rootScope.movieData
        }

        vm.searchId = function(id) {
            vm.processing = true;
            $rootScope.utils.search_film(null, null, id).then(function(film) {
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

    }).filter('poster', function() {
        return function(poster) {
            if (poster) return poster
            return "./assets/img/missingPoster.jpg"
        };
    })