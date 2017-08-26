angular.module('filmCtrl', ['ngMaterial'])

    .controller('FilmController', function($rootScope, $scope, service, $location, $mdBottomSheet, $mdDialog ) {
        var vm = this;


        ///////////////////////////////////////////////////
        //-------------- Load Film Metadata...  ---------//
        /////////////////////////////////////////////////// 
        vm.getMovie = function() {
            vm.movieData = service.getSelectedFilm();
            vm.scenes = service.getScenes();
            vm.movieData.tags = []

            console.log(vm.movieData)

            if (vm.movieData.images.backdrops[0]) {
                vm.css = {
                    'background': 'linear-gradient( rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(' + vm.movieData.images.backdrops[0] + ') no-repeat center center',
                    'background-size': 'cover',
                }
            }

            $scope.settings = $rootScope.utils.get_settings() // TODO: this reads a file... store the value...
            console.log("get_settings from film controller")


            /* Apply user's default filter settings on film tags */
            var skip_tags = $scope.settings.tags.filter(function(tag) { return tag.action == false })
            var list_tags = $scope.settings.tags.filter(function(tag) { return tag.action != true  })

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
        }

        vm.getMovie();

        $scope.showListBottomSheet = function(mode) {
            service.setMode(mode)
            $scope.alert = '';
            $mdBottomSheet.show({
                templateUrl: 'views/bottom-sheet-list-template.html',
                locals: { scenes: vm.scenes, settings: $scope.settings },
                controller: BottonSheetDialogController
            })

            function BottonSheetDialogController($scope, scenes, $mdDialog) {
                var vm = this
                vm.movieData = service.getSelectedFilm();
                var lan = "ES"; //TODO: settings.language
                if (vm.movieData.providers[lan]) $scope.providers = vm.movieData.providers[lan];
                //$scope.providers.push({ name: "Youtube", url: "https://www.youtube.com/watch?v=VoIoEhNmfsM" })
                $scope.providers.push({ name: "File/DVD", url: "file", icon: 'file.svg' })
                $scope.providers.push({ name: "Custom URL", url: "custom", icon: 'add.svg' })

                vm.forceHttps = function(url) {
                    return url // some providers fail
                    //return 'https://' + url.replace(/^https?:\/\//, "");
                }


                $scope.playFile = function(event) {
                    var file = event.target.files;
                    console.log("playFile: ", file)
                    $mdBottomSheet.hide(file[0].path);
                    $rootScope.file = "file:///" + file[0].path
                    $location.path('/stream');
                    $rootScope.utils.link_file_to_film($rootScope.file, vm.movieData.id.imdb)
                    load_film(scenes, service.getMode(), service.getSyncRef())
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
                        load_film(scenes, service.getMode(), service.getSyncRef())
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
                    load_film(scenes, service.getMode(), service.getSyncRef())
                };
            }
        }

        $scope.backToSearch = function(argument) {
            $location.path('/');
        }

        vm.newScene = function(argument) {
            var index = service.addScene()
            $scope.main.editScene(index)
        }

        vm.share = function() {
            $rootScope.utils.share_scenes(service.getSelectedFilm()).then(function(answer) {
                $rootScope.openToast(answer.data)
            })
        }

        vm.parentsGuide = function($event) {
            $rootScope.file = "https://www.imdb.com/title/" + vm.movieData.id.imdb + "/parentalguide"
            $location.path('/stream');
        }

        vm.kidsInMind = function(argument) {
            $rootScope.file = "http://www.kids-in-mind.com/cgi-bin/search/search.pl?q=" + vm.movieData.metadata.title
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
            if ( !string ) return ""
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        function allUp( string ) {
            if ( !string ) return ""
            return string.toUpperCase();
        }

        function money( ammount, currency ) {
            if (!ammount ) return ""
            var currencies = { "EUR": "€", "USD":"$", "GBP": "£" }
            var symbol = currencies[currency]? currencies[currency] : ""
            if ( currency = "GBP" ) return symbol+ammount
            return ammount+symbol
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