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
            console.log("[add scene] ",arguments)
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

        vm.editScene = function(id, $event) {
            pause(true)
            $mdDialog.show({
                targetEvent: $event,
                templateUrl: 'views/edit-scene-template.html',
                locals: { id: id, editScene: vm.editScene },
                controller: ['$scope', 'id', 'editScene', function($scope, id, editScene) {
                    //$scope.scene = service.getScenes()[ id ]
                    $scope.scene = $rootScope.movieData.scenes[id]

                    $scope.selectedItem = null;
                    $scope.searchText = null;
                    var tags = $rootScope.utils.get_settings().tags;
                    $scope.tagsSex = extractTags(tags, "Sex")
                    $scope.tagsVio = extractTags(tags, "Violence")
                    $scope.tagsOth = extractTags(tags, "Others")
                    $scope.selectedTags = $scope.scene.tags;
                    console.log($scope.tagsVio);

                    function extractTags(all_tags, type) {
                        var filtered_tags = []
                        for (var i = 0; i < all_tags.length; i++) {
                            if (all_tags[i].type !== type) continue
                            filtered_tags.push(all_tags[i].name);
                        }
                        return filtered_tags
                    }

                    $scope.closeDialog = function() {
                        $mdDialog.hide();
                        $scope.scene.tags = $scope.selectedTags
                        $scope.scene.edited = true
                        $scope.scene.diffTag = $rootScope.utils.get_diff_tag($scope.scene, $rootScope.movieData.online_scenes)
                        $rootScope.utils.save_edition($rootScope.movieData)
                        pause(false)
                    }

                    $scope.backToList = function() {
                        $mdDialog.hide()
                        $rootScope.showSceneList()
                    }

                    $scope.preview = function() {
                        skip.preview($scope.scene.start, $scope.scene.end)
                        setTimeout(function() { editScene(id) }, 4000);
                        $scope.closeDialog()
                    }

                    $scope.shareEditedScene = function($event) {
                        $mdDialog.hide()
                        $rootScope.uploadContent(id,$event)
                    }

                    $scope.remove = function() {
                        $mdDialog.hide();
                        console.log("[remove] deleting scene")
                        var scenes = angular.copy($rootScope.movieData.scenes);
                        scenes.splice(id, 1)
                        $rootScope.movieData.scenes = scenes
                        $rootScope.utils.save_edition($rootScope.movieData)
                        pause(false)
                    }

                }]
            })
        }



        $rootScope.uploadContent = function( id,$event) {
            pause(true)
            $mdDialog.show({
                targetEvent: $event,
                templateUrl: 'views/scene-share-template.html',
                locals: { id: id },
                controller: ['$scope', 'id', function($scope, id, editScene) {
                    //$scope.scene = service.getScenes()[ id ]
                    $scope.tagStatus = $rootScope.movieData.tagStatus

                    /*$scope.tagsSex = extractTags(tags, "Sex")
                    $scope.tagsVio = extractTags(tags, "Violence")
                    $scope.tagsOth = extractTags(tags, "Others")

                    function extractTags(all_tags, type) {
                        var filtered_tags = []
                        for (var i = 0; i < all_tags.length; i++) {
                            if (all_tags[i].type !== type) continue
                            filtered_tags.push(all_tags[i].name);
                        }
                        return filtered_tags
                    }*/

                    $scope.share = function(id) {
                        //var scene = $rootScope.movieData.scenes[id]
                        $rootScope.utils.share_scenes($rootScope.movieData).then(function(answer) {
                            $rootScope.openToast(answer.data)
                            if ( answer.status == 500 ) return
                            for (var i = 0; i < $rootScope.movieData.scenes.length; i++) {
                                $rootScope.movieData.scenes[i].edited = false
                            }
                        })
                    }
                    
                    

                }]
            })
        }



    });