angular.module('streamCtrl', ['ngMaterial'])

    .controller('StreamController', function($rootScope, $scope, $location, $mdDialog, $timeout) {

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

        var healthy_color = "rgba(200, 200, 200, 0.6)"

        $scope.show_buttons = true
        $scope.health_color = healthy_color


        $scope.mouseActive = function() {
            $scope.show_buttons = true
            if (last_moved == false) {
                last_moved = Date.now()
                hide_buttons_when_inactive()
            } else {
                last_moved = Date.now()
            }
        }

        var last_moved = false

        function hide_buttons_when_inactive() {
            console.log("checking inactive")
            if (Date.now() - last_moved < 3000 || $scope.health_color != healthy_color) {
                setTimeout(function() { hide_buttons_when_inactive() }, 500);
            } else {
                $scope.show_buttons = false
                $rootScope.$apply();
                last_moved = false
            }
        }


        $scope.markTime = function($event) {
            var wb = document.querySelector('#webview');
            if (wb) wb.send('mark-current-time')
            $scope.show_buttons = true
        }


        $scope.backToMenu = function($event) {
            console.log("Closing stream controller")
            // Stop timers...
            window.onkeyup = null

            $rootScope.electron.ipcRenderer.send('exit-fullscreen')
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


        function health_update(health) {
            if (health < 0.8) {
                $scope.show_buttons = true
                var red = 255 * (1 - health) // Red color
                var oth = 0.5 * 255 * (1 - health) // Others (blue and green) color
                var opa = health // Opacity
                $scope.health_color = "rgba(" + red + ", " + oth + ", " + oth + "," + opa + ")"
            } else {
                $scope.health_color = "rgba(200, 200, 200, 0.6)"
                $scope.show_buttons = false
            }
            $rootScope.$apply();
        }


        if (!onimdb) {
            //---- Listen to keyboard "mark time" events ----//
            window.onkeyup = function(e) {
                var key = e.keyCode ? e.keyCode : e.which;
                if (key == 110) $scope.$apply($scope.markTime())
            }
        }



        // Webview functions
        var wc = {
            loaded: false,
            webview: false,

            // load the webview
            load: function() {
                /* Check there is a "webview" tag and that it is not already loaded */
                if (wc.loaded) return console.log("webview already loaded! ")
                wc.webview = document.getElementsByTagName('webview')[0]
                if (!wc.webview) return console.log("webview not ready yet ")


                /* Listen to events from player */
                wc.webview.addEventListener('ipc-message', event => {
                    if (event.channel == 'updated-reference') {
                        console.log("updated-reference", event.args[0])
                        $rootScope.utils.save_sync_ref(event.args[0], $rootScope.movieData.id.tmdb)
                    } else if (event.channel == 'preview-finished') {
                        setTimeout(function() { $rootScope.editScene(null, 'preview', event.args[0]) }, 3000);
                    } else if (event.channel == 'marked-scene') {
                        $rootScope.editScene(null, 'preview', event.args[0])
                    } else if (event.channel == 'updated-sync') {
                        $rootScope.movieData.scenes = event.args[0]
                    } else if (event.channel == 'updated-metadata') {
                        var meta = event.args[0]
                        $rootScope.metadata = meta
                        //return true // TODO: search properly...

                        if (meta.url == $rootScope.file) {
                            console.log("[updated-metadata] we are where we are meant to be", meta)
                            return
                        }
                        // TODO: Use the other data eg. internal_id, or provider...
                        console.log("[updated-metadata] we got new meta! ", meta)
                        $rootScope.utils.search_film(null, meta.title, null, meta.internal_id).then(function(film) {
                            film = film["data"];
                            console.log(film)
                            if (film.type == "list") {
                                $rootScope.setFilm(film)
                                $location.path('/chooseFilmTable');
                                console.log(film);
                                //$route.reload();
                                if (!$rootScope.$$phase) $rootScope.$apply();
                            } else {
                                /*if( $rootScope.movieData.id.tmdb == film.id.tmdb ){
                                    console.log("[updated-metadata] Same movie as before, we are fine!")
                                    return
                                }*/
                                $rootScope.setFilm(film)
                                console.log(film, film.syncRef);
                                wc.webview.send('load-new-reference', film.syncRef)
                                $rootScope.pickScenes()
                            }
                        });
                    } else {
                        console.log("ipc-message received: ", event.channel)
                    }
                })

                wc.loaded = true

                return true;
            }
        }

        wc.load()

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