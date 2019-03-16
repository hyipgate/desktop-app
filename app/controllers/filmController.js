angular.module('filmCtrl', ['ngMaterial'])

    .controller('FilmController', function($rootScope, $scope, $location, $mdBottomSheet, $mdDialog) {
        var vm = this;


        ///////////////////////////////////////////////////
        //-------------- Load Film Metadata...  ---------//
        /////////////////////////////////////////////////// 

        vm.getMovie = function() {
            vm.scenes = $rootScope.movieData.scenes
            vm.movieData = $rootScope.movieData

            console.log($rootScope.movieData)

            if ($rootScope.movieData.images.backdrops[0]) {
                vm.css = {
                    'background': 'linear-gradient( rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(' + $rootScope.movieData.images.backdrops[0] + ') no-repeat center center',
                    'background-size': 'cover',
                }
            }

            // Check if the user wants to skip tags we don't have info about
            var tagStatus = $rootScope.movieData.tagStatus
            var missingTags = []
            for (var i = 0; i < $rootScope.settings.tags.length; i++) {
                for (var j = 0; j < tagStatus.length; j++) {
                    if (tagStatus[j].name == $rootScope.settings.tags[i].name) {
                        if (!tagStatus[j].done && $rootScope.settings.tags[i].action !== false) {
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


            /* Show share button, only if there are edited scenes */
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
                locals: { scenes: vm.scenes, settings: $rootScope.settings },
                controller: BottonSheetDialogController
            })

            function BottonSheetDialogController($scope, settings, scenes, $mdDialog) {
                var vm = this

                vm.getProviders = function() {
                    // Get the language
                    var lan = settings.language
                    if (lan == "auto") { // pick the first lan from the list (TODO: find out another way)
                        lan = Object.keys($rootScope.movieData.providers)[0]
                    }
                    console.log($rootScope.movieData.providers, lan)

                    // Remove unsopported providers (done locally coz different platforms might support different providers)
                    var playable = [];
                    var unsupported_providers = ["Apple iTunes"];
                    var providers = $rootScope.movieData.providers[lan]
                    if (providers) {
                        for (var i = 0; i < providers.length; i++) {
                            if (unsupported_providers.indexOf(providers[i].name) != -1) continue
                            playable.push(providers[i])
                        }
                    }

                    // If there are manually added default providers
                    if (settings.default_providers) {
                        var urls = settings.default_providers.split(";")
                        for (var i = 0; i < urls.length; i++) {
                            var name = urls[i].split("->")
                            var url = name[1].replace(/#imdb/, $rootScope.movieData.id.imdb);
                            url = url.replace(/#title/, $rootScope.movieData.metadata.title);
                            var tmdb = $rootScope.movieData.id.tmdb.split("_")
                            if (tmdb[0] == "episode") {
                                url = url.replace(/#season/, tmdb[2]);
                                url = url.replace(/#episode/, tmdb[3]);
                            }
                            url = url.replace(/#tmdb/, tmdb[1]);
                            playable.push({ name: name[0], url: url, icon: 'add.svg' })
                        }
                    }
                    playable.push({ name: "File/DVD", url: "file", icon: 'file.svg' })
                    playable.push({ name: "Custom URL", url: "custom", icon: 'add.svg' })
                    return playable
                }
                $scope.providers = vm.getProviders();

                vm.forceHttps = function(url) {
                    // some providers fail on https... add https only when missing protocol
                    //return 'https://' + url.replace(/^https?:\/\//, "");
                    if (url.indexOf("http") == 0) return url
                    return 'https://' + url
                }


                $scope.playFile = function(event) {
                    var file = event.target.files;
                    console.log("playFile: ", file)
                    $mdBottomSheet.hide(file[0].path);
                    $rootScope.file = file[0].path;
                    var ffmpegPromise = $rootScope.utils.checkConversion($rootScope.file);
                    ffmpegPromise.then(function(needsConversion) {
                        if (!needsConversion.audio && !needsConversion.video) {
                            $rootScope.file = "file:///" + file[0].path
                            $rootScope.utils.link_file_to_film($rootScope.file, $rootScope.movieData.id.tmdb)
                            // TODO, pass bytesize and hash of file, instead of filename! We want it to be an ID shared between users!
                            $location.path('/stream');
                        } else {
                            vm.unsupportedFile(needsConversion);
                        }
                    });
                }

                vm.unsupportedFile = function(needsConversion) {
                    // Appending dialog to document.body to cover sidenav in docs app
                    var confirm = $mdDialog.confirm()
                        .title('Unsupported file')
                        .textContent('Sorry, only certain video/audio formats are currently supported.')
                        .ok('Convert video')
                        .cancel('Cancel')

                    $mdDialog.show(confirm).then(function(needsConversion) {
                        /* Preparing conversion
                         */
                        var ffmpegPromise = $rootScope.utils.convertFile($rootScope.file, needsConversion);
                        ffmpegPromise.then(function(ffmpegCommand) {
                            vm.conversionDialog(ffmpegCommand);
                        });
                    }, function() {});
                };

                vm.conversionDialog = function showDialog(ffmpegCommand) {
                    var parentEl = angular.element(document.body);
                    $mdDialog.show({
                        parent: parentEl,
                        template: '<md-dialog aria-label="Progress">' +
                            '  <md-dialog-content>' +
                            '    <md-list style="margin-top: 0.5em">' +
                            '      <md-list-item>' +
                            '        <p class="md-title">Conversion: </p>' +
                            '      </md-list-item>' +
                            '      <md-list-item>' +
                            '       <md-progress-circular style="margin-top:0.5em;margin-left:40%" md-mode="indeterminate"></md-progress-circular>' +
                            '       </md-list-item><md-list-item>' +
                            '       <p style="text-align:center;margin-top:0.5em;">{{conversionProgress | number : 2}}% </p>' +
                            '      ' +
                            '    </md-list-item></md-list>' +
                            '  </md-dialog-content>' +
                            '  <md-dialog-actions>' +
                            '    <md-button ng-click="cancelConversion(ffmpegCommand)" class="md-primary">' +
                            '      Cancel' +
                            '    </md-button>' +
                            '  </md-dialog-actions>' +
                            '</md-dialog>',
                        locals: {
                            conversionProgress: $scope.conversionProgress,
                            ffmpegCommand: $scope.ffmpegCommand
                        },
                        controller: DialogController
                    });

                    function DialogController($scope, $mdDialog, conversionProgress) {
                        $scope.conversionProgress = 0.0;
                        $scope.ffmpegCommand = ffmpegCommand;
                        $scope.conversionFinished = false;
                        var update = function() {
                            setTimeout(function() {
                                $scope.conversionProgress = $rootScope.electron.remote.getGlobal('gVar').conversionProgress;
                                $scope.conversionFinished = $rootScope.electron.remote.getGlobal('gVar').conversionFinished;
                                $scope.$apply()
                                if ($scope.conversionFinished) {
                                    $rootScope.file = $scope.ffmpegCommand._currentOutput.target;
                                    vm.startMovieAfterConversion();
                                } else {
                                    update();
                                }
                            }, 1400);
                        }
                        $scope.cancelConversion = function(ffmpegCommand) {
                            $rootScope.utils.killConversion(ffmpegCommand);
                            $mdDialog.hide();
                        }
                        update();
                    }
                }

                vm.startMovieAfterConversion = function() {
                    // Appending dialog to document.body to cover sidenav in docs app
                    var confirm = $mdDialog.confirm()
                        .title('Conversion Finished')
                        .textContent('Start watching?')
                        .ok('Yes!')
                        .cancel('Later')

                    $mdDialog.show(confirm).then(function() {
                        $rootScope.file = "file:///" + $rootScope.file;
                        $rootScope.utils.link_file_to_film($rootScope.file, $rootScope.movieData.id.tmdb)
                        $location.path('/stream');
                        $mdDialog.hide();
                    }, function() {
                        console.log('Canceled');
                        $mdDialog.hide();
                    });
                };

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


        // Open a external website
        vm.openWebsite = function function_name( website ) {
            if ( website == "imdb") $rootScope.file = "https://www.imdb.com/title/" + $rootScope.movieData.id.imdb + "/parentalguide";
            if ( website == "kidsinmind") $rootScope.file = "http://www.kids-in-mind.com/cgi-bin/search/search.pl?q=" + $rootScope.movieData.metadata.title
            $location.path('/stream');
        }



    }).filter('minutes', function() {
        return function(input) {
            input = input || 0;
            return Math.floor(input / 60 / 1000)
        };
    }).filter('seconds', function() {
        return function(start, end) {
            var len = Math.floor((end - start) / 1000);
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