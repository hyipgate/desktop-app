angular.module('app.routes', ['ngRoute'])

.config(function($routeProvider, $locationProvider) {
  
  $routeProvider

    .when('/', {
      templateUrl : './views/select.html',
      controller  : 'MainController',
          controllerAs: 'main',
    })

    .when('/film', {
      templateUrl : './views/film.html',
      controller  : 'FilmController',
          controllerAs: 'film',
    })

    .otherwise({ redirectTo: '/'})

});