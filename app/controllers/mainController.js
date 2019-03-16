angular.module('mainCtrl', ['ngMaterial'])

    .controller('MainController', function($rootScope, $route, $scope, $location, $window, $q, $mdDialog, $mdToast) {
        var vm = this;
        var timeZoneOffset = new Date('01/01/1970').getTimezoneOffset() * 60 * 1000;
        vm.processing = false;
        vm.beforeConfig = "main";
        vm.searchQuery = "";

        $rootScope.movieData = {}
        $rootScope.metadata = {}
        $rootScope.electron = require('electron');
        $rootScope.utils = $rootScope.electron.remote.require('./app/assets/js/utils');
        $rootScope.appVersion = require('../package.json').version;

        $rootScope.settings = $rootScope.utils.get_settings()

        $rootScope.vtrue = true
        $rootScope.vfalse = false
        $rootScope.vnull = null

        $scope.defaultProviders = [
            { name: 'Netlix', url: "https://www.netflix.com/", icon: "netflix" },
            { name: 'Prime', url: "https://www.amazon.com/Amazon-Video/b/?&node=2858778011", icon: "amazon-prime-video" },
            { name: "File/DVD", url: "file", icon: 'file.svg' }
        ]

        $scope.explore = [
            { name: 'search', url: "search", icon: "search.svg" },
            { name: 'justwatch', url: "https://www.justwatch.com/", icon: "justwatch.png" },
            { name: 'imdb', url: "https://www.imdb.com/", icon: "imdb.png" }
        ]

        console.log($scope.defaultProviders)

        $rootScope.openToast = function(msg) {
            $mdToast.show($mdToast.simple().textContent(msg).hideDelay(2000));
        };

        $scope.closeSettings = function() {
            $rootScope.saveSettings()
            $location.path(vm.beforeConfig);
        }

        $scope.openSettings = function() {
            vm.beforeConfig = $location.path();
            $location.path('/config');
        }

        $rootScope.saveSettings = function() {
            console.log("saving data ", $rootScope.settings)
            $rootScope.utils.set_settings($rootScope.settings)
        }

        $scope.closeCommunity = function() {
            $rootScope.saveSettings()
            $location.path(vm.beforeConfig);
        }

        $scope.openCommunity = function() {
            vm.beforeConfig = $location.path();
            $location.path('/community');
        }

        $rootScope.setFilm = function(film) {
            console.log("[setFilm] ", film)
            $rootScope.movieData = film
            /* Apply user's default filter settings on film tags */
            var skip_tags = $rootScope.settings.tags.filter(function(tag) { return tag.action === true })
            var list_tags = $rootScope.settings.tags.filter(function(tag) { return tag.action !== false })

            for (var i = 0; i < film.scenes.length; i++) {
                // Decide wheter to skip scene or not
                film.scenes[i].skip = false // default: no not skip
                for (var j = 0; j < skip_tags.length; j++) {
                    if (film.scenes[i].tags.indexOf(skip_tags[j].name) != -1) {
                        film.scenes[i].skip = true;
                        break
                    }
                }
                // Decide wheter to show the scene on the list or not
                film.scenes[i].list = film.scenes[i].skip // By default, we always show scenes that will be skipped
                for (var j = 0; j < list_tags.length; j++) {
                    if (film.scenes[i].tags.indexOf(list_tags[j].name) != -1) {
                        film.scenes[i].list = true;
                        break
                    }
                }
            }
        }

        vm.getFile = function(event) {
            vm.processing = true;
            var file = event.target.files;
            if (file) {
                vm.search_film(file[0].path).then(function(film) {
                    vm.processing = false;
                    film = film["data"];
                    if (film.type == "list") {
                        $rootScope.setFilm(film)
                        $location.path('/chooseFilmTable');
                        if (!$rootScope.$$phase) $rootScope.$apply();
                    } else {
                        $rootScope.setFilm(film)
                        $location.path('/film');
                        if (!$rootScope.$$phase) $rootScope.$apply();
                    }
                })
            } else {
                vm.processing = false
                console.log('ERROR');
            }
        };

        vm.loadProvider = function(provider) {
            console.log("loadProvider", provider, provider)
            if (provider == "search") {
                $location.path('/chooseFilmTable');
                if (!$rootScope.$$phase) $rootScope.$apply();
                return
            } else if (provider == "file") {
                var input = document.getElementById('fileInput')
                //input.onchange = $scope.playFile
                input.click()
                return;
            }
            $rootScope.file = provider
            $location.path('/stream')
        };

        vm.searchTitle = function() {
            if (!vm.searchQuery) return console.log("[searchTitle] error, got undefined searchQuery");
            vm.processing = true;
            vm.search_film(null, vm.searchQuery).then(function(film) {
                if (vm.processing == false) return // already loaded :)
                vm.processing = false;
                film = film["data"];
                if (film.type == "list") {
                    $rootScope.setFilm(film)
                    $location.path('/chooseFilmTable');
                    console.log(film);
                    //$route.reload();
                    if (!$rootScope.$$phase) $rootScope.$apply();
                } else {
                    console.log(film);
                    $rootScope.setFilm(film)
                    $location.path('/film');
                    if (!$rootScope.$$phase) $rootScope.$apply();
                }
            });
        };

        vm.selected = function(film_id) {
            $rootScope.utils.search_film(null, null, film_id).then(function(film) {
                $rootScope.setFilm(film.data);
                $location.path('/film');
                if (!$rootScope.$$phase) $rootScope.$apply();
            });
        }

        vm.search_film = function(filepath, title) {
            return $rootScope.utils.search_film(filepath, title, null);
        }

        $rootScope.logIn = function(ev) {
            console.log("log_in")
            $mdDialog.show({
                template: '<md-dialog layout="column" md-theme="darkTheme">' +
                    '  <md-dialog-content>' +
                    '    <md-content layout="column" layout-padding>' +
                    '      <md-input-container style="margin:15px 0 0 0;"><label>Username</label><input type="text" ng-model="name"/></md-input-container>' +
                    '      <md-input-container style="margin:0;"><label>Password</label><input type="password" ng-model="pass"/></md-input-container>' +
                    '  </md-dialog-content>' +
                    '  <md-dialog-actions>' +
                    '    <md-button ng-click="cancel()">Cancel</md-button>' +
                    '    <md-button ng-click="login()" class="md-primary">Log In</md-button>' +
                    '  </md-dialog-actions>' +
                    '</md-dialog>',
                targetEvent: ev,
                controller: LogInDialogController,
                preserveScope: true,
                autoWrap: true,
                skipHide: true
            })

            function LogInDialogController($scope, $mdDialog) {


                $scope.name = $rootScope.settings.username
                $scope.pass = ""

                $scope.cancel = function() {
                    console.log("cancel")
                    $mdDialog.hide();
                }

                $scope.login = function() {
                    console.log("cancel")
                    console.log($scope.name, $scope.pass)
                    $rootScope.utils.log_in($scope.name, $scope.pass).then(function(answer) {
                        if (answer["status"] && answer["status"] == 200) {
                            $rootScope.openToast("You are in!")
                            $mdDialog.hide()
                        } else {
                            $rootScope.openToast(answer.data)
                        }
                    })
                }
            }
        }

        function webview(action, data) {
            var wb = document.querySelector('#webview');
            if (!wb) {
                console.log("(ERROR) Trying to '", action, "' but we don't have a webview!");
                return
            }
            console.log("[wc.send] Doing '", action, "' with ", data)
            wb.send(action, data)
        }

        $rootScope.pickScenes = function($event) {
            webview('dialog-visible', true)
            $mdDialog.show({
                targetEvent: $event,
                templateUrl: 'views/pick-scenes-dialog.html',
                onRemoving: function(event) {
                    webview('dialog-visible', false)
                    var wb = document.querySelector('#webview');
                    if (wb) wb.focus()
                },
                controller: ['$scope', function($scope) {
                    console.log($rootScope.movieData.scenes)
                    $scope.scenes = $rootScope.movieData.scenes

                    $scope.movieData = $rootScope.movieData
                }]
            })
        }

        /*******************************************************************/
        /*                      EDIT SCENE DIALOG                          */
        /*******************************************************************/

        $rootScope.editScene = function($event, open, previewed_scene) {
            webview('dialog-visible', true)
            webview('get-scenes')
            $mdDialog.show({
                targetEvent: $event,
                templateUrl: 'views/scene-edit-share-dialog.html',
                onRemoving: function(event) {
                    webview('dialog-visible', false)
                    var wb = document.querySelector('#webview');
                    if (wb) wb.focus()
                },
                locals: { previewed_scene: previewed_scene, open: open },
                controller: ['$scope', 'open', 'previewed_scene', function($scope, open, previewed_scene) {

                    console.log(open)


                    $scope.movieData = $rootScope.movieData
                    $scope.tags = $rootScope.settings.tags

                    $scope.openListDialog = function(argument) {
                        $scope.scenes = $rootScope.movieData.scenes
                        if ($rootScope.file) {
                            $scope.isDumpable = (($rootScope.file).indexOf("file:///") == 0)
                        }
                        if ($location.path() == '/film') {
                            $scope.nopreview = true
                        }
                        $scope.menu = 0
                    }

                    $scope.openEditDialog = function(id) {
                        var index = find_key_by_id($rootScope.movieData.scenes, id)
                        var scene = $rootScope.movieData.scenes[index]
                        loadEditInputs(scene)
                    }

                    function loadEditInputs(data) {
                        console.log(data)
                        var times = data.times[$rootScope.metadata.src]
                        var start = times ? times[0] : data.start
                        var end = times ? times[1] : data.end
                        data.end = null
                        data.start = null
                        $scope.startTime = new Date(start + timeZoneOffset)
                        $scope.endTime = new Date(end + timeZoneOffset)
                        $scope.selectedTags = angular.copy(data.tags)
                        $scope.comment = angular.copy(data.comment)
                        $scope.id = data.id
                        $scope.scene = data
                        $scope.menu = 1
                    }

                    function find_key_by_id(list, id) {
                        for (var i = 0; i < list.length; i++) {
                            if (list[i].id == id) return i
                        }
                        return -1;
                    }

                    function getEditInputs() {
                        var scene = $scope.scene
                        var start = $scope.startTime.getTime() - timeZoneOffset
                        var end = $scope.endTime.getTime() - timeZoneOffset
                        scene.times[$rootScope.metadata.src] = [start, end, 1]
                        scene.comment = $scope.comment
                        scene.tags = $scope.selectedTags
                        return scene
                    }

                    $scope.openTaggedDialog = function() {
                        $scope.tagStatus = $rootScope.movieData.tagStatus
                        $scope.menu = 2
                    }

                    $scope.updateTagged = function() {
                        $rootScope.utils.update_tagged($scope.tagStatus, $rootScope.movieData.id.tmdb)
                        $scope.hideDialog()
                    }

                    $scope.saveEdition = function() {
                        //if ($scope.selectedTags.length == 0) return $rootScope.openToast("Need at least one tag")
                        //if ($scope.comment.length < 5 ) return $rootScope.openToast("Need a brief comment")
                        var scene = getEditInputs()
                        scene.edited = true
                        scene.local = true
                        scene.removed = false

                        var index = find_key_by_id($rootScope.movieData.scenes, scene.id)
                        if (index == -1) index = $rootScope.movieData.scenes.length

                        var scenes = angular.copy($rootScope.movieData.scenes);
                        scenes[index] = scene
                        $rootScope.movieData.scenes = scenes
                        var film_id = $rootScope.movieData.id.tmdb
                        $rootScope.utils.save_edition(film_id, scene)
                        $scope.openListDialog()
                    }

                    $scope.previewScene = function(id) {
                        var index = find_key_by_id($rootScope.movieData.scenes, id)
                        var scene = $rootScope.movieData.scenes[index]
                        console.log("previewing ", scene)
                        webview('preview', scene)
                        $scope.hideDialog()
                    }

                    $scope.previewCurrent = function($event) {
                        var scene = getEditInputs()
                        console.log("previewing ", scene)
                        webview('preview', scene)
                        $scope.hideDialog()
                    }

                    $scope.hideDialog = function(action) {
                        $mdDialog.hide()
                    }

                    $scope.uploadCurrent = function() {
                        var index = find_key_by_id($rootScope.movieData.scenes, $scope.id)
                        $scope.uploadScene(index)
                    }

                    $scope.uploadScene = function(id) {
                        var index = find_key_by_id($rootScope.movieData.scenes, id)


                        var film_id = $rootScope.movieData.id.tmdb
                        var scene = $rootScope.movieData.scenes[index]

                        if (scene.tags.length == 0) return $rootScope.openToast("Need at least one tag")
                        if (scene.comment.length < 5) return $rootScope.openToast("Need a brief comment")

                        $rootScope.utils.share_scene(scene, film_id).then(function(answer) {
                            $rootScope.openToast(answer.data.message || answer.data)
                            if (answer.status == 500) return
                            $rootScope.movieData.scenes[index].edited = false
                            $rootScope.movieData.scenes[index].local = !answer.data.accepted
                            $rootScope.utils.save_edition(film_id, $rootScope.movieData.scenes[index])
                            $rootScope.movieData.scenes[index].globallyremoved = scene.removed && answer.data.accepted
                        })
                    }

                    $scope.removeScene = function() {
                        console.log("[remove] deleting scene")
                        var index = find_key_by_id($rootScope.movieData.scenes, $scope.id)
                        if (index != -1) {
                            var scenes = angular.copy($rootScope.movieData.scenes);
                            scenes[index].removed = true
                            scenes[index].local = true
                            scenes[index].edited = true
                            $rootScope.movieData.scenes = scenes
                            var film_id = $rootScope.movieData.id.tmdb
                            $rootScope.utils.save_edition(film_id, scenes[index])
                        }
                        $scope.openListDialog()
                    }

                    $scope.timeChanged = function(what) {
                        if (what == "start") {
                            var date = $scope.startTime
                            var lastTime = lastStart
                        } else {
                            var date = $scope.endTime
                            var lastTime = lastEnd
                        }
                        console.log(date);
                        var time = [date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()]
                        console.log(time)
                        var max = [6, 59, 59, 960]
                        for (var i = time.length - 2; i >= 0; i--) {
                            console.log(lastTime[i + 1], max[i + 1], time[i + 1])
                            if (lastTime[i + 1] >= max[i + 1] && time[i + 1] == 0) {
                                time[i] = time[i] + 1
                                if (time[i] > max[i]) time[i] = 0
                            } else if (lastTime[i + 1] == 0 && time[i + 1] >= max[i + 1]) {
                                time[i] = time[i] - 1
                                if (time[i] < 0) time[i] = max[i]
                            }
                        }
                        if (time[0] > 5) time[0] = 5
                        var ms = time[3] + 1000 * (time[2] + 60 * (time[1] + 60 * time[0]))
                        console.log(time);
                        console.log(timeZoneOffset);
                        var new_date = new Date(ms + timeZoneOffset);
                        console.log(new_date);
                        if (what == "start") {
                            lastStart = time
                            if (date != new_date) $scope.startTime = new_date
                        } else {
                            lastEnd = time
                            if (date != new_date) $scope.endTime = new_date
                        }
                        webview('go-to-frame', ms)
                    }

                    function pad(n, width, z) {
                        z = z || '0';
                        n = n + '';
                        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
                    }

                    var lastStart = [5, 5, 5, 5]
                    var lastEnd = [5, 5, 5, 5]

                    $scope.dumpToFile = function() {
                        var file = $rootScope.electron.remote.require('./app/assets/js/file');
                        $scope.hideDialog(true)
                        const { dialog } = require('electron').remote;
                        dialog.showSaveDialog((output) => {
                            var scenes = $rootScope.movieData.scenes
                            var skip_list = []
                            for (var i = 0; i < scenes.length; i++) {
                                var scene = scenes[i]
                                if (scene.skip) skip_list.push(scene)
                            }
                            var input = $rootScope.file

                            console.log("[dumpToFile] ", input, skip_list, output)

                            file.dumpToFile(input, skip_list, output)

                            $rootScope.openToast("Creating file on the background")
                        })

                    }

                    if (open == "preview") {
                        loadEditInputs(previewed_scene)
                    } else if (open == "tagged") {
                        $scope.openTaggedDialog()
                    } else {
                        $scope.openListDialog()
                    }

                }]
            })
        }

    })