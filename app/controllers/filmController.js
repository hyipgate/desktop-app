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

            console.log("get_settings from film controller")


            /* Apply user's default filter settings on film tags */
            var skip_tags = $rootScope.settings.tags.filter(function(tag) { return tag.action === true })
            var list_tags = $rootScope.settings.tags.filter(function(tag) { return tag.action !== false })

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

            /* Checked if wants to skip tags we don't have info about */
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
                    /* RegEx for checking valid file format
                        /^(.*\.(mp4)$)/
                        /^(.*\.(mp4|avi)$)/
                    */
                    $rootScope.file = file[0].path;
                    if(/^(.*\.(mp4)$)/.test(file[0].path)){
                        $rootScope.file = "file:///" + file[0].path
                        $rootScope.utils.link_file_to_film($rootScope.file, $rootScope.movieData.id.tmdb)
                        // TODO, instead of pass bytesize and hash of file, instead of filename! We want it to be an ID shared between users!
                        load_film(scenes, $rootScope.file, $rootScope.movieData.syncRef)
                        $location.path('/stream');
                    }else{
                        vm.unsupportedFile();
                    }
                }

                vm.unsupportedFile = function(ev) {
                    // Appending dialog to document.body to cover sidenav in docs app
                    var confirm = $mdDialog.confirm()
                        .title('Unsupported file')
                        .textContent('Sorry, only .mp4 files are currently supported.')
                        .ok('Convert')
                        .cancel('Cancel')

                    $mdDialog.show(confirm).then(function() {
                        /* Preparing conversion
                        */
                        var ffmpegPromise = $rootScope.utils.convertFile($rootScope.file);
                        ffmpegPromise.then(function(ffmpegCommand){
                            vm.conversionDialog(ffmpegCommand); 
                        });                        
                    }, function() {
                    });
                };

                vm.conversionDialog = function showDialog(ffmpegCommand) {
                   var parentEl = angular.element(document.body);
                   $mdDialog.show({
                     parent: parentEl,
                     template:
                       '<md-dialog aria-label="Progress">' +
                       '  <md-dialog-content>'+
                       '    <md-list style="margin-top: 0.5em">'+
                       '      <md-list-item>'+
                       '        <p class="md-title">Conversion: </p>'+
                       '      </md-list-item>'+
                       '      <md-list-item>'+
                       '       <md-progress-circular style="margin-top:0.5em;margin-left:40%" md-mode="indeterminate"></md-progress-circular>'+
                       '       </md-list-item><md-list-item>'+
                       '       <p style="text-align:center;margin-top:0.5em;">{{conversionProgress | number : 2}}% </p>' +
                       '      '+
                       '    </md-list-item></md-list>'+
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
                    var update = function(){
                        setTimeout(function(){
                            $scope.conversionProgress = $rootScope.electron.remote.getGlobal('gVar').conversionProgress;
                            $scope.conversionFinished = $rootScope.electron.remote.getGlobal('gVar').conversionFinished;
                            $scope.$apply()
                            if($scope.conversionFinished){
                                $rootScope.file = $scope.ffmpegCommand._currentOutput.target;
                                vm.startMovieAfterConversion();
                            }else{
                                update();
                            }
                        },1400);
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
                        .textContent('¿Start watching?')
                        .ok('Yes!')
                        .cancel('Later')

                    $mdDialog.show(confirm).then(function() {
                        $rootScope.file = "file:///" + $rootScope.file;
                        $rootScope.utils.link_file_to_film($rootScope.file, $rootScope.movieData.id.tmdb)
                        load_film(scenes, $rootScope.file, $rootScope.movieData.syncRef);
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
                        load_film(scenes, $rootScope.file, $rootScope.movieData.syncRef)
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
                    load_film(scenes, $rootScope.file, $rootScope.movieData.syncRef)
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