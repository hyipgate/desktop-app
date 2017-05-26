angular.module('familyCinema', ['ngAnimate', 'ngMessages', 'app.routes', 'MainService', 'mainCtrl','ngMaterial','filmCtrl', 'chooseFilmCtrl', 'streamCtrl'])

.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('green', {
      'default': '500',
      'hue-1': '100',
      'hue-2': '700',
    })
    .accentPalette('indigo', {
      'default': '500',
      'hue-1': '100',
      'hue-2': '700',
    });

  $mdThemingProvider.theme('darkTheme')
    .primaryPalette('green', {
      'default': '500',
      'hue-1': '100',
      'hue-2': '700',
    })
    .accentPalette('indigo', {
      'default': '500',
      'hue-1': '100',
      'hue-2': '700',
    })
    .dark();
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