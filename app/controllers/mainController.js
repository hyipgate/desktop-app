angular.module('mainCtrl', ['ngMaterial'])

    .controller('MainController', function($rootScope, $route, $scope, service, $location, $window, $q, $mdDialog, $mdToast) {
        var vm = this;
        vm.processing = false;
        vm.searchQuery;
        vm.beforeConfig = "main";

        vm.searchQuery = service.getSearchQuery();

        $rootScope.electron = require('electron');
        $rootScope.utils = $rootScope.electron.remote.require('./app/assets/js/utils');

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

        $rootScope.addScene = function(start = -1, end = -1, tags = [], comment = "") {
            console.log("[add scene] ", arguments)
            var scene = {
                id: random_id(),
                tags: tags,
                comment: comment,
                start: start,
                end: end
            }
            var scenes = angular.copy($rootScope.movieData.scenes);
            scenes.push(scene)
            $rootScope.movieData.scenes = scenes
            return (scenes.length - 1)
        }

        function random_id() {
            var text = ""
            var possible = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
            for (var i = 0; i < 10; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            };
            return text;
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

        $rootScope.editScene = function($event, open, id) {
            pause(true)
            $mdDialog.show({
                targetEvent: $event,
                templateUrl: 'views/scene-edit-share-dialog.html',
                locals: { id: id, open: open },
                controller: ['$scope', 'id', 'open', function($scope, id, open) {


                    $scope.openListDialog = function(argument) {
                        $scope.scenes = $rootScope.movieData.scenes
                        $scope.isDumpable = (($rootScope.file).indexOf("file:///") == 0)
                        $scope.menu = 0
                    }

                    $scope.openEditDialog = function(index, $event) {
                        $scope.scene = $rootScope.movieData.scenes[index]
                        $scope.selectedTags = $scope.scene.tags;
                        $scope.id = index
                        $scope.menu = 1
                    }

                    $scope.openShareDialog = function() {
                        $scope.tagStatus = $rootScope.movieData.tagStatus
                        $scope.menu = 2
                    }

                    console.log(open)

                    if (open == "edit") {
                        $scope.openEditDialog(id)
                    } else if (open == "share") {
                        $scope.openShareDialog()
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
                        $scope.scene.tags = $scope.selectedTags
                        $scope.scene.edited = true
                        $scope.scene.diffTag = $rootScope.utils.get_diff_tag($scope.scene, $rootScope.movieData.online_scenes)
                        $rootScope.utils.save_edition($rootScope.movieData)
                        $scope.openListDialog()
                    }

                    $scope.previewScene = function($event, menu, index) {
                        var scene = $rootScope.movieData.scenes[index]
                        skip.preview(scene.start, scene.end)
                        setTimeout(function() { $rootScope.editScene($event, menu, index) }, 4000);
                        $scope.hideDialog()
                    }

                    $scope.hideDialog = function (action) {
                        $mdDialog.hide()
                        pause(!!action)
                    }

                    $scope.uploadScenes = function() {
                        $rootScope.utils.share_scenes($rootScope.movieData).then(function(answer) {
                            $rootScope.openToast(answer.data)
                            if (answer.status == 500) return
                            for (var i = 0; i < $rootScope.movieData.scenes.length; i++) {
                                $rootScope.movieData.scenes[i].edited = false
                            }
                        })
                    }

                    $scope.removeScene = function() {
                        console.log("[remove] deleting scene")
                        var scenes = angular.copy($rootScope.movieData.scenes);
                        scenes.splice(id, 1)
                        $rootScope.movieData.scenes = scenes
                        $rootScope.utils.save_edition($rootScope.movieData)
                        $scope.openListDialog()
                    }

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