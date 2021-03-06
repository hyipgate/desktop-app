angular.module('familyCinema', ['ngAnimate', 'ngMessages', 'app.routes', 'mainCtrl','ngMaterial','filmCtrl', 'chooseFilmCtrl', 'streamCtrl','configCtrl','communityCtrl', "threeStateCheckbox"])

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
    .accentPalette('green', {
      'default': '500',
      'hue-1': '100',
      'hue-2': '700',
      'hue-3': '600',
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