angular.module('familyCinema', ['ngAnimate', 'ngMessages', 'app.routes', 'MainService', 'mainCtrl','ngMaterial'])

.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('green', {
      'default': '500',
      'hue-1': '100',
      'hue-2': '700',
    })
    .accentPalette('orange', {
      'default': '500'
    });
})

.directive('customOnChange', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var onChangeHandler = scope.$eval(attrs.customOnChange);
      element.bind('change', onChangeHandler);
    }
  };
});