angular.module('app.routes', ['ngRoute'])

.config(function($routeProvider, $locationProvider) {

  $routeProvider

    .when('/select', {
      templateUrl : 'views/select.html',
      controller  : 'MainController',
          controllerAs: 'main',
    })

    .otherwise({ redirectTo: '/select'})

});