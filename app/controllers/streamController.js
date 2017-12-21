angular.module('streamCtrl', ['ngMaterial'])

    .controller('StreamController', function($rootScope, $scope, service, $location, $mdDialog) {
        var vm = this;
        vm.src = $rootScope.file
        $scope.settings = $rootScope.utils.get_settings()
        $scope.scenes = $rootScope.movieData.scenes

        ///////////////////////////////////////////////////
        //-------- Control buttons over player ----------//
        ///////////////////////////////////////////////////

        vm.isDumpable = ((vm.src).indexOf("file:///") == 0) ? "block" : "none";
        console.log(vm.src, vm.isDumpable)

        vm.show_menu = "none"
        vm.health_color = "rgba(200, 200, 200, 0.6)"
        $scope.webview_blur = 0;

        $scope.show_buttons = function(argument) {
            vm.show_menu = "block"
            vm.last_moved = Date.now()
        }

        // Check periodically to: (1) hide controls if unactive, (2) show controls in red if film is out of sync
        function check() {
            // Check we are on sync
            var illness = sync.health_report()
            if (illness > 5000) {
                vm.show_menu = "block"
                var red = Math.min(255, Math.floor(illness / 100)) // Red color
                var oth = Math.min(0, 200 - Math.floor(illness / 200)) // Others (blue and green) color
                var opa = Math.min(1, Math.floor(illness / 2500) / 10) // Opacity
                vm.health_color = "rgba(" + red + ", " + oth + ", " + oth + "," + opa + ")"
                $rootScope.$apply();
                return
            }
            // Check last activity and hide controls if needed
            if (vm.show_menu != "none" && vm.last_moved && vm.last_moved + 2000 < Date.now()) {
                vm.show_menu = "none"
                vm.health_color = "rgba(200, 200, 200, 0.6)"
                $rootScope.$apply();
            }

            if (skip.openPreview) editScene($index)
        }
        var interval_id = setInterval(check, 1000);



        ///////////////////////////////////////////////////
        //---- Listen to keyboard "mark time" events ----//
        ///////////////////////////////////////////////////
        window.onkeyup = function(e) {
            var key = e.keyCode ? e.keyCode : e.which;
            if (key == 110) $scope.$apply($scope.markTime())
        }

        $scope.markTime = function() {
            var scene = mark_current_time()
            if (scene) {
                var index = $rootScope.addScene(scene.start, scene.end)
                $scope.main.editScene(index)
                $scope.webview_blur = 0;
            } else {
                $scope.webview_blur = 20;
                // background: repeating-linear-gradient(45deg,gray,gray 10px,white 10px, white 20px )"
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






        ///////////////////////////////////////////////////
        //-------------- Show Scene List Dialog ---------//
        ///////////////////////////////////////////////////
        $scope.sceneList = function($event) {
            pause(true)
            $mdDialog.show({
                targetEvent: $event,
                locals: {
                    editScene: $scope.main.editScene,
                    isDumpable: vm.isDumpable,
                    sceneList: $scope.sceneList,
                },
                templateUrl: 'views/scene-list-template.html',
                controller: sceneListController
            })

            function sceneListController($scope, $mdDialog, editScene, isDumpable, sceneList) {

                $scope.isDumpable = isDumpable
                $scope.scenes = $rootScope.movieData.scenes
                console.log($scope.scenes)
                console.log(isDumpable)

                $scope.closeAndEditScene = function($index, $event) {
                    $mdDialog.hide()
                    editScene($index)
                }

                $scope.previewScene = function($index, $event) {
                    var scene = $rootScope.movieData.scenes[$index]
                    skip.preview(scene.start, scene.end )
                    setTimeout(function() { sceneList() }, 4000);
                    $mdDialog.hide()
                }

                $scope.dumpToFile = function() {
                    var file = $rootScope.electron.remote.require('./app/assets/js/file');
                    $mdDialog.hide()
                    const { dialog } = require('electron').remote;
                    dialog.showSaveDialog((output) => {
                        var scenes = $rootScope.movieData.scenes
                        var skip_list = []
                        for (var i = 0; i < scenes.length; i++) {
                            var scene = scenes[i]
                            if (scene.skip) skip_list.push({ start: scene.start - 0.08, end: scene.end + 0.08 })
                        }
                        var input = $rootScope.file

                        console.log("[dumpToFile] ", input, skip_list, output)

                        file.dumpToFile(input, skip_list, output)

                        $rootScope.openToast("Creating file on the background")
                    })

                }
            }
        }

        $rootScope.showSceneList = $scope.sceneList


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