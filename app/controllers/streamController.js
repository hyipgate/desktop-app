angular.module('streamCtrl', ['ngMaterial'])

    .controller('StreamController', function($rootScope, $scope, service, $location, $mdDialog, $timeout) {
        
        // Just to know how long the user has been watching the film
        var launchedAt = Date.now()
        // Behaviour is different when it is not a film
        var onimdb = ($rootScope.file.indexOf("http://www.kids-in-mind.com/") == 0) || ($rootScope.file.indexOf("https://www.imdb.com/title/") == 0)
        //


        // Hacky method to reload webview once the dom is really loaded
        // To-Do. Implement in a correct way
        angular.element(document).ready(function() {
            $timeout(function() {
                var q = document.querySelector('#webview');
                q.setAttribute("src", $rootScope.file);
                q.reload();
            }, 200);
        });




        console.log("Starting StreamController ", $rootScope.file, onimdb)

        $scope.scenes = $rootScope.movieData.scenes
        $scope.back_menu = false
        $scope.editors_menu = false
        $scope.health_color = "rgba(200, 200, 200, 0.6)"
        $scope.webview_blur = 0;

        $scope.show_buttons = function(action) {
            $scope.back_menu = action
            if (!onimdb) $scope.editors_menu = action
            $scope.last_moved = Date.now()
        }


        $scope.markTime = function($event) {
            function random_id() {
                var text = ""
                var possible = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
                for (var i = 0; i < 10; i++) {
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                };
                return text;
            }

            var marked_scene = mark_current_time()
            if (marked_scene) {
                var scene = {
                    tags: [],
                    comment: "",
                    start: marked_scene.start,
                    end: marked_scene.end,
                    id: random_id(),
                    src: reference.our_src
                }
                $rootScope.editScene($event, "preview", scene)
                $scope.webview_blur = 0;
            } else {
                $scope.webview_blur = $rootScope.settings.blur_level;
                $scope.show_buttons(true)
            }
        }



        $scope.backToMenu = function($event) {
            console.log("Closing stream controller")
            // Stop timers...
            clearInterval(interval_id);
            window.onkeyup = null
            var syncRef = end_capture()
            // If we got new syncRef
            if (syncRef) {
                console.log("We got syncRef, length: ", Object.keys(syncRef).length)
                $rootScope.movieData.syncRef[syncRef.src] = syncRef
                console.log(syncRef)
                $rootScope.utils.save_sync_ref($rootScope.movieData.id.tmdb, JSON.stringify(syncRef))
            }
            // Go back to film view
            $location.path('/film');
            // Ask user for feedback
            ask_user_if_everything_was_tagged()
        }


        // Ask user if there was any unwanted scene
        function ask_user_if_everything_was_tagged() {
            // Avoid asking on imdb
            if (onimdb) return console.log("Not asking coz imdb is not a film")

            // Avoid asking if user was just having a quick look
            var timeWatching = Date.now() - launchedAt
            if (timeWatching < 1000 * 60 * 20) return console.log("Not asking coz user spent only ", timeWatching / 1000, "s watching the film")

            // Avoid asking if the user is not bothered about the tags that might be missing
            // Get a list of scenes the user is sensible to (those not marked as ignore)
            var skip_tags = []
            var tagSettings = $rootScope.settings.tags
            for (var i = 0; i < tagSettings.length; i++) {
                if (tagSettings[i].action !== false) skip_tags.push(tagSettings[i].name)
            }

            // If there was an unwanted tag we weren't sure we had all the info about, ask
            var tagStatus = $rootScope.movieData.tagStatus
            for (var i = 0; i < tagStatus.length; i++) {
                console.log(tagStatus[i].done, tagStatus[i].name)
                if (tagStatus[i].done === null && skip_tags.indexOf(tagStatus[i].name) != -1) {
                    // TODO: ask only about that tag
                    $rootScope.editScene($event, "tagged")
                    break
                }
            }
        }

        // Check periodically to: (1) hide controls if unactive, (2) show controls in red if film is out of sync
        function check() {
            // Check we are on sync
            var illness = sync.health_report()
            if (illness > 5000) {
                $scope.show_buttons(true)
                var red = Math.min(255, Math.floor(illness / 100)) // Red color
                var oth = Math.min(0, 200 - Math.floor(illness / 200)) // Others (blue and green) color
                var opa = Math.min(1, Math.floor(illness / 2500) / 10) // Opacity
                $scope.health_color = "rgba(" + red + ", " + oth + ", " + oth + "," + opa + ")"
                $rootScope.$apply();
                return
            }
            // Check last activity and hide controls if needed
            if ($scope.back_menu && $scope.last_moved && $scope.last_moved + 2000 < Date.now()) {
                if ($scope.webview_blur !== 0) return
                $scope.show_buttons(false)
                $scope.health_color = "rgba(200, 200, 200, 0.6)"
                $rootScope.$apply();
            }
        }

        if (!onimdb) {
            var interval_id = setInterval(check, 1000);
            //---- Listen to keyboard "mark time" events ----//
            window.onkeyup = function(e) {
                var key = e.keyCode ? e.keyCode : e.which;
                if (key == 110) $scope.$apply($scope.markTime())
            }
        }

        // Some filters
    }).filter('minutes', function() {
        return function(input) {
            input = input || 0;
            return Math.floor(input / 60 / 1000)
        };
    }).filter('seconds', function() {
        return function(start, end) {
            var len = Math.floor((end - start) / 1000);
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