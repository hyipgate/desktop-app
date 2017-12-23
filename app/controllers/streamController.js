angular.module('streamCtrl', ['ngMaterial'])

    .controller('StreamController', function($rootScope, $scope, service, $location, $mdDialog) {
        var vm = this;
        vm.src = $rootScope.file
        $scope.settings = $rootScope.utils.get_settings()
        $scope.scenes = $rootScope.movieData.scenes

        var onimdb = ($rootScope.file.indexOf("http://www.kids-in-mind.com/") == 0) || ($rootScope.file.indexOf("https://www.imdb.com/title/") == 0)

        ///////////////////////////////////////////////////
        //-------- Control buttons over player ----------//
        ///////////////////////////////////////////////////

        console.log("Starting StreamController ",vm.src, onimdb)

        $scope.back_menu = false
        $scope.editors_menu = false

        vm.health_color = "rgba(200, 200, 200, 0.6)"
        $scope.webview_blur = 0;

        $scope.show_buttons = function( action ) {
            $scope.back_menu = action
            if( $scope.settings.editors_view && !onimdb ) $scope.editors_menu = action
            vm.last_moved = Date.now()
        }

        // Check periodically to: (1) hide controls if unactive, (2) show controls in red if film is out of sync
        function check() {
            // Check we are on sync
            var illness = sync.health_report()
            if (illness > 5000) {
                $scope.show_buttons( true )
                var red = Math.min(255, Math.floor(illness / 100)) // Red color
                var oth = Math.min(0, 200 - Math.floor(illness / 200)) // Others (blue and green) color
                var opa = Math.min(1, Math.floor(illness / 2500) / 10) // Opacity
                vm.health_color = "rgba(" + red + ", " + oth + ", " + oth + "," + opa + ")"
                $rootScope.$apply();
                return
            }
            // Check last activity and hide controls if needed
            if ( $scope.back_menu  && vm.last_moved && vm.last_moved + 2000 < Date.now()) {
                $scope.show_buttons( false )
                vm.health_color = "rgba(200, 200, 200, 0.6)"
                $rootScope.$apply();
            }
        }

        if (!onimdb) {
            var interval_id = setInterval(check, 1000);
        }




        ///////////////////////////////////////////////////
        //---- Listen to keyboard "mark time" events ----//
        ///////////////////////////////////////////////////
        window.onkeyup = function(e) {
            var key = e.keyCode ? e.keyCode : e.which;
            if (key == 110) $scope.$apply($scope.markTime())
        }

        $scope.markTime = function($event) {
            var scene = mark_current_time()
            if (scene) {
                var index = $rootScope.addScene(scene.start, scene.end)
                $rootScope.editScene($event, "edit", index)
                $scope.webview_blur = 0;
            } else {
                $scope.webview_blur = 20;
            }
        }

        ///////////////////////////////////////////////////
        //------ Stop ALL stream related timers... ------//
        ///////////////////////////////////////////////////
        $scope.backToFilm = function(argument) {
            console.log("Closing stream controller")
            // Stop timers...
            clearInterval(interval_id);
            window.onkeyup = null
            var sref562 = end_capture()
            console.log("sref562 length: ", sref562)
            // If we are on edit mode, save reference
            if (sref562) {
                console.log("We got new sync data")
                var a = JSON.stringify(sref562)
                console.log(a)
                $rootScope.utils.save_sync_ref($rootScope.movieData["id"]["imdb"], a)
                service.setSyncRef(sref562)
            }
            // Go back to film view
            $location.path('/film');
        }

        // Some filters
    }).filter('minutes', function() {
        return function(input) {
            input = input || 0;
            return Math.floor(input / 60)
        };
    }).filter('seconds', function() {
        return function(start, end) {
            var len = Math.floor(end - start);
            if (len > 60) {
                var min = Math.floor(len / 60)
                var str = min + "min " + (len - 60 * min) + "s"
            } else {
                var str = len + "s"
            }
            return str
        };
    }).filter('tags', function() {
        return function(input) {
            input = input || []
            return input.join(", ")
        };
    }).config(function($sceDelegateProvider) {
        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            '**'
        ]);
    })