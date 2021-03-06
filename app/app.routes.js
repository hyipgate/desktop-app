angular.module('app.routes', ['ngRoute'])

.config(function($routeProvider, $locationProvider) {
  
  $routeProvider

    .when('/', {
      templateUrl : './views/select.html',
      controller  : 'MainController',
      controllerAs: 'main',
    })

    .when('/chooseFilmTable', {
      templateUrl : './views/chooseFilmTable.html',
      controller  : 'ChooseFilmTableController',
      controllerAs: 'set',
    })

    .when('/film', {
      templateUrl : './views/film.html',
      controller  : 'FilmController',
      controllerAs: 'film',
    })

    .when('/stream', {
      templateUrl : './views/stream.html',
      controller  : 'StreamController',
      controllerAs: 'stream',
    })

    .when('/config', {
      templateUrl : './views/config.html',
      controller  : 'ConfigController',
      controllerAs: 'config',
    })

    .when('/community', {
      templateUrl : './views/community.html',
      controller  : 'CommunityController',
      controllerAs: 'community',
    })


    .otherwise({ redirectTo: '/'})

});