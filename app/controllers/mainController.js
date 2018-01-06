angular.module('mainCtrl', ['ngMaterial'])

    .controller('MainController', function($rootScope, $route, $scope, service, $location, $window, $q, $mdDialog, $mdToast) {
        var vm = this;
        vm.processing = false;
        vm.searchQuery;
        vm.beforeConfig = "main";

        vm.searchQuery = service.getSearchQuery();

        $rootScope.electron = require('electron');
        $rootScope.utils = $rootScope.electron.remote.require('./app/assets/js/utils');
        $rootScope.appVersion = require('../package.json').version;

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

        $scope.closeCommunity = function() {
            $rootScope.saveSettings()
            $location.path(vm.beforeConfig);
        }

        $scope.openCommunity = function() {
            vm.beforeConfig = $location.path();
            $location.path('/community');
        }

        $rootScope.setFilm = function(film) {
            //service.saveSelectedFilm(film);
            $rootScope.movieData = film
        }

        vm.getFile = function(event) {
            vm.processing = true;
            var file = event.target.files;
            //service.setFile( file[0].path )
            if (file) {
                vm.search_film(file[0].path, null).then(function(film) {
                    vm.processing = false;
                    film = film["data"];
                    if (film.type == "list") {
                        $rootScope.setFilm(film)
                        service.saveSearchQuery(vm.searchQuery);
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

        vm.searchTitle = function() {
            if (!vm.searchQuery) return console.log("[searchTitle] error, got undefined searchQuery");
            vm.processing = true;
            vm.search_film(null, vm.searchQuery).then(function(film) {
                if (vm.processing == false) return // already loaded :)
                vm.processing = false;
                film = film["data"];
                if (film.type == "list") {
                    $rootScope.setFilm(film)
                    service.saveSearchQuery(vm.searchQuery);
                    $location.path('/chooseFilmTable');
                    console.log(film);
                    $route.reload();
                    if (!$rootScope.$$phase) $rootScope.$apply();
                } else {
                    console.log(film);
                    $rootScope.setFilm(film)
                    $location.path('/film');
                    if (!$rootScope.$$phase) $rootScope.$apply();
                }
            });
        };

        vm.selected = function(imdbid) {
            $rootScope.utils.search_film(null, null, null, imdbid).then(function(film) {
                $rootScope.setFilm(film.data);
                $location.path('/film');
                if (!$rootScope.$$phase) $rootScope.$apply();
            });
        }

        vm.search_film = function(filepath, title) {
            return $rootScope.utils.search_film(filepath, title, null, null);
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


                $scope.name = $rootScope.utils.get_settings().username
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

        $rootScope.editScene = function($event, open, previewed_scene) {
            pause(true)
            isDialogVisible = true
            $mdDialog.show({
                targetEvent: $event,
                templateUrl: 'views/scene-edit-share-dialog.html',
                onRemoving: function(event) {
                    pause(false)
                    isDialogVisible = false
                },
                locals: { previewed_scene: previewed_scene, open: open },
                controller: ['$scope', 'open', 'previewed_scene', function($scope, open, previewed_scene) {


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

                    $scope.openEditDialog = function(index) {
                        var scene = $rootScope.movieData.scenes[index]
                        loadEditInputs(scene)
                    }

                    function loadEditInputs(data) {
                        $scope.startTime = new Date(data.start * 1000)
                        $scope.endTime = new Date(data.end * 1000)
                        $scope.selectedTags = angular.copy(data.tags);
                        $scope.comment = angular.copy(data.comment);
                        $scope.id = data.id
                        $scope.menu = 1
                    }

                    function find_key_by_id(list, id) {
                        for (var i = 0; i < list.length; i++) {
                            if (list[i].id == id) return i
                        }
                        return -1;
                    }

                    function getEditInputs() {
                        var scene = {
                            tags: $scope.selectedTags,
                            start: $scope.startTime.getTime() / 1000,
                            end: $scope.endTime.getTime() / 1000,
                            comment: $scope.comment,
                            id: $scope.id
                        }
                        return scene
                    }

                    $scope.openShareDialog = function() {
                        $scope.tagStatus = $rootScope.movieData.tagStatus
                        $scope.menu = 2
                    }

                    console.log(open)

                    if (open == "preview") {
                        loadEditInputs(previewed_scene)
                    } else {
                        $scope.openListDialog()
                    }


                    var tags = $rootScope.utils.get_settings().tags;
                    $scope.tagsSex = extractTags(tags, "Sex")
                    $scope.tagsVio = extractTags(tags, "Violence")
                    $scope.tagsOth = extractTags(tags, "Others")


                    function extractTags(all_tags, type) {
                        var filtered_tags = []
                        for (var i = 0; i < all_tags.length; i++) {
                            if (all_tags[i].type !== type) continue
                            filtered_tags.push(all_tags[i].name);
                        }
                        return filtered_tags
                    }

                    $scope.saveEdition = function() {
                        if ($scope.selectedTags.length == 0) return $rootScope.openToast("Need at least one tag")
                        //if ($scope.comment.length < 5 ) return $rootScope.openToast("Need a brief comment")
                        var scene = getEditInputs()
                        scene.edited = true
                        scene.local = true
                        scene.removed = false

                        var index = find_key_by_id($rootScope.movieData.scenes, scene.id)
                        console.log(index)
                        if (index == -1) index = $rootScope.movieData.scenes.length

                        var scenes = angular.copy($rootScope.movieData.scenes);
                        scenes[index] = scene
                        $rootScope.movieData.scenes = scenes
                        var film_id = $rootScope.movieData.id.tmdb
                        $rootScope.utils.save_edition(film_id, scene)
                        $scope.openListDialog()
                    }

                    $scope.previewScene = function($event, index) {
                        var scene = $rootScope.movieData.scenes[index]
                        skip.preview(scene.start, scene.end)
                        setTimeout(function() { $rootScope.editScene($event, "list") }, 5000);
                        $scope.hideDialog()
                    }

                    $scope.previewCurrent = function($event) {
                        var data = getEditInputs()
                        skip.preview(data.start, data.end)
                        setTimeout(function() { $rootScope.editScene($event, "preview", data) }, 5000);
                        $scope.hideDialog()
                    }

                    $scope.hideDialog = function(action) {
                        $mdDialog.hide()
                        //pause(!!action)
                    }

                    $scope.uploadCurrent = function() {
                        var index = find_key_by_id($rootScope.movieData.scenes, $scope.id)
                        $scope.uploadScene(index)
                    }

                    $scope.uploadScene = function(index) {
                        var film_id = $rootScope.movieData.id.tmdb
                        var scene = $rootScope.movieData.scenes[index]

                        if (scene.tags.length == 0) return $rootScope.openToast("Need at least one tag")

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

                        var scenes = angular.copy($rootScope.movieData.scenes);
                        scenes[index].removed = true
                        scenes[index].local = true
                        scenes[index].edited = true
                        $rootScope.movieData.scenes = scenes

                        var film_id = $rootScope.movieData.id.tmdb
                        $rootScope.utils.save_edition(film_id, scenes[index])
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
                        console.log(time)
                        var new_date = new Date(ms);
                        if (what == "start") {
                            lastStart = time
                            if (date != new_date) $scope.startTime = new_date
                        } else {
                            lastEnd = time
                            if (date != new_date) $scope.endTime = new_date
                        }
                        go_to_frame(ms / 1000)
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
                                if (scene.skip) skip_list.push({ start: scene.start - 0.08, end: scene.end + 0.08 })
                            }
                            var input = $rootScope.file

                            console.log("[dumpToFile] ", input, skip_list, output)

                            file.dumpToFile(input, skip_list, output)

                            $rootScope.openToast("Creating file on the background")
                        })

                    }

                }]
            })
        }

    });