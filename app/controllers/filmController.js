angular.module('filmCtrl', ['ngMaterial'])

    .controller('FilmController', function($rootScope, $scope, service, $location, $mdBottomSheet, $mdDialog) {
        var vm = this;


        ///////////////////////////////////////////////////
        //-------------- Load Film Metadata...  ---------//
        /////////////////////////////////////////////////// 
        vm.getMovie = function() {
            vm.scenes = $rootScope.movieData.scenes //service.getScenes();
            vm.movieData = $rootScope.movieData

            console.log($rootScope.movieData)

            if ($rootScope.movieData.images.backdrops[0]) {
                vm.css = {
                    'background': 'linear-gradient( rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(' + $rootScope.movieData.images.backdrops[0] + ') no-repeat center center',
                    'background-size': 'cover',
                }
            }

            $scope.settings = $rootScope.utils.get_settings() // TODO: this reads a file... store the value...
            console.log("get_settings from film controller")


            /* Apply user's default filter settings on film tags */
            var skip_tags = $scope.settings.tags.filter(function(tag) { return tag.action == false })
            var list_tags = $scope.settings.tags.filter(function(tag) { return tag.action != true })

            for (var i = 0; i < vm.scenes.length; i++) {
                // Decide wheter to skip scene or not
                vm.scenes[i].skip = false // default: no not skip
                for (var j = 0; j < skip_tags.length; j++) {
                    if (vm.scenes[i].tags.indexOf(skip_tags[j].name) != -1) {
                        vm.scenes[i].skip = true;
                        break
                    }
                }
                // Decide wheter to show the scene on the list or not
                vm.scenes[i].list = vm.scenes[i].skip // default: show if skiping
                for (var j = 0; j < list_tags.length; j++) {
                    if (vm.scenes[i].tags.indexOf(list_tags[j].name) != -1) {
                        vm.scenes[i].list = true;
                        break
                    }
                }
            }

            var tagStatus = $rootScope.movieData.tagStatus
            var missingTags = []
            for (var i = 0; i < $scope.settings.tags.length; i++) {
                for (var j = 0; j < tagStatus.length; j++) {
                    if (tagStatus[j].name == $scope.settings.tags[i].name) {
                        if (!tagStatus[j].done && $scope.settings.tags[i].action !== true) {
                            missingTags.push(tagStatus[j].name)
                        }
                        break
                    }
                }

            }
            $scope.missingTagsFullList = missingTags.join(", ")
            if (missingTags.length == 0) {
                $scope.missingTags = ""
            } else if (missingTags.length < 6) {
                $scope.missingTags = "This movie might content untagged scenes of " + missingTags.join(", ")
            } else {
                $scope.missingTags = "This movie is not fully edited yet and might content unwanted scenes."
            }



            $scope.share_button = false
            for (var i = 0; i < vm.scenes.length; i++) {
                if (vm.scenes[i].edited) {
                    $scope.share_button = true
                    break
                }
            }

        }

        vm.getMovie();

        $scope.showListBottomSheet = function(mode) {
            $scope.alert = '';
            $mdBottomSheet.show({
                templateUrl: 'views/bottom-sheet-list-template.html',
                locals: { scenes: vm.scenes, settings: $scope.settings },
                controller: BottonSheetDialogController
            })

            function BottonSheetDialogController($scope, settings, scenes, $mdDialog) {
                var vm = this

                vm.getProviders = function(lan) {
                    if (lan == "auto") {
                        lan = Object.keys($rootScope.movieData.providers)[0] // TODO
                    }
                    console.log($rootScope.movieData.providers, lan)
                    var playable = [];
                    var unsupported_providers = ["Apple iTunes"];
                    var providers = $rootScope.movieData.providers[lan]
                    if (providers) {

                        for (var i = 0; i < providers.length; i++) {
                            console.log(providers[i].name)
                            if (unsupported_providers.indexOf(providers[i].name) != -1) continue
                            playable.push(providers[i])
                        }
                    }
                    playable.push({ name: "File/DVD", url: "file", icon: 'file.svg' })
                    playable.push({ name: "Custom URL", url: "custom", icon: 'add.svg' })
                    return playable
                }
                $scope.providers = vm.getProviders(settings.language);

                vm.forceHttps = function(url) {
                    // somre provider fail on https... add https only when missing protocol
                    //return 'https://' + url.replace(/^https?:\/\//, "");
                    if (url.indexOf("http") == 0) return url
                    return 'https://' + url
                }


                $scope.playFile = function(event) {
                    var file = event.target.files;
                    console.log("playFile: ", file)
                    $mdBottomSheet.hide(file[0].path);
                    $rootScope.file = "file:///" + file[0].path
                    $location.path('/stream');
                    $rootScope.utils.link_file_to_film($rootScope.file, $rootScope.movieData.id.tmdb)
                    load_film(scenes, $rootScope.file, $rootScope.movieData, $rootScope.movieData.syncRef)
                }

                vm.showPrompt = function(ev) {
                    // Appending dialog to document.body to cover sidenav in docs app
                    var confirm = $mdDialog.prompt()
                        .title('Insert custom url')
                        .placeholder('www.netflix.com')
                        .targetEvent(ev)
                        .ok('Load')
                        .cancel('Cancel');

                    $mdDialog.show(confirm).then(function(custom_url) {
                        custom_url = vm.forceHttps(custom_url)
                        console.log("custom URL: ", custom_url)
                        $mdBottomSheet.hide(custom_url);
                        $rootScope.file = custom_url
                        $location.path('/stream');
                        load_film(scenes, $rootScope.file, $rootScope.movieData.syncRef)
                    }, function() {
                        $scope.status = 'You didn\'t name your dog.';
                    });
                };

                $scope.listItemClick = function($index) {
                    var clickedItem = $scope.providers[$index]
                    if (clickedItem.url == "file") {
                        var input = document.getElementById('fileInput')
                        input.onchange = $scope.playFile
                        input.click()
                        return;
                    } else if (clickedItem.url == "custom") {
                        console.log(vm)
                        vm.showPrompt()
                        return;
                    }
                    $mdBottomSheet.hide(clickedItem.name);
                    $rootScope.file = vm.forceHttps(clickedItem.url)
                    $location.path('/stream');
                    load_film(scenes, $rootScope.file, $rootScope.movieData.syncRef)
                };
            }
        }

        $scope.backToSearch = function(argument) {
            $location.path('/');
        }

        vm.share = function() {
            $rootScope.utils.share_scenes($rootScope.movieData).then(function(answer) {
                $rootScope.openToast(answer.data)
            })
        }

        vm.parentsGuide = function($event) {
            $rootScope.file = "https://www.imdb.com/title/" + $rootScope.movieData.id.imdb + "/parentalguide"
            $location.path('/stream');
        }

        vm.kidsInMind = function(argument) {
            $rootScope.file = "http://www.kids-in-mind.com/cgi-bin/search/search.pl?q=" + $rootScope.movieData.metadata.title
            $location.path('/stream');
        }



    }).filter('minutes', function() {
        return function(input) {
            input = input || 0;
            return Math.floor(input / 60)
        };
    }).filter('seconds', function() {
        return function(start, end) {
            var len = Math.floor(end - start);
            console.log(len)
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
            return input.join(", ")
        };
    }).filter('provider', function() {

        function firstUp(string) {
            if (!string) return ""
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        function allUp(string) {
            if (!string) return ""
            return string.toUpperCase();
        }

        function money(ammount, currency) {
            if (!ammount) return ""
            var currencies = { "EUR": "€", "USD": "$", "GBP": "£" }
            var symbol = currencies[currency] ? currencies[currency] : ""
            if (currency == "GBP") return symbol + ammount
            return ammount + symbol
        }

        return function(provider) {
            if (!provider.price) return provider.name
            return firstUp(provider.price[2]) + " " + allUp(provider.price[3]) + " " + money(provider.price[0], provider.price[1])
        };
    }).filter('icon', function() {
        return function(provider) {
            if (provider.icon) return provider.icon
            return "ondemand.svg"
        };
    })