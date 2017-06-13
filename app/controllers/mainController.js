angular.module( 'mainCtrl', [ 'ngMaterial' ] )

.controller( 'MainController', function( $rootScope, $route, $scope, service, $location, $window, $q, $mdDialog, $mdToast ) {
    var vm = this;
    vm.processing = false;
    vm.searchQuery;
    vm.beforeConfig = "main";

    vm.searchQuery = service.getSearchQuery();

    $rootScope.electron = require( 'electron' );
    $rootScope.utils = $rootScope.electron.remote.require( './app/assets/js/utils' );

    $rootScope.openToast = function( msg ) {
        $mdToast.show($mdToast.simple().textContent( msg ).hideDelay(2000));
    };

    $scope.closeSettings = function() {
        $rootScope.saveSettings()
        $location.path( vm.beforeConfig );
    }

    $scope.openSettings = function() {
        vm.beforeConfig = $location.path();
        $location.path( '/config' );
    }

    vm.getFile = function( event ) {
        vm.processing = true;
        var file = event.target.files;
        //service.setFile( file[0].path )
        if ( file ) {
            vm.search_film( file[ 0 ].path, null ).then( function( film ) {
                vm.processing = false;
                film = film[ "data" ];
                if ( film.type == "list" ) {
                    service.saveSelectedFilm( film );
                    service.saveSearchQuery( vm.searchQuery );
                    $location.path( '/chooseFilmTable' );
                    if ( !$rootScope.$$phase ) $rootScope.$apply();
                } else {
                    service.saveSelectedFilm( film );
                    $location.path( '/film' );
                    if ( !$rootScope.$$phase ) $rootScope.$apply();
                }
            } )
        } else {
            console.log( 'ERROR' );
        }
    };

    vm.searchTitle = function() {
        vm.processing = true;
        vm.search_film( null, vm.searchQuery ).then( function( film ) {
            vm.processing = false;
            film = film[ "data" ];
            if ( film.type == "list" ) {
                service.saveSelectedFilm( film );
                service.saveSearchQuery( vm.searchQuery );
                $location.path( '/chooseFilmTable' );
                console.log( film );
                $route.reload();
                if ( !$rootScope.$$phase ) $rootScope.$apply();
            } else {
                console.log( film );
                service.saveSelectedFilm( film );
                $location.path( '/film' );
                if ( !$rootScope.$$phase ) $rootScope.$apply();
            }
        } );
    };

    vm.selected = function( imdbid ) {
        $rootScope.utils.search_film( null, null, null, imdbid ).then( function( film ) {
            console.log( film );
            service.saveSelectedFilm( film.data );
            $location.path( '/film' );
            if ( !$rootScope.$$phase ) $rootScope.$apply();
        } );
    }

    vm.search_film = function( filepath, title ) {
        //return $rootScope.utils.search_film(text);
        return $rootScope.utils.search_film( filepath, title, null, null );
    }

    vm.editScene = function( id, $event ) {
        $mdDialog.show( {
            targetEvent: $event,
            templateUrl: 'views/edit-scene-template.html',
            locals: { id: id },
            controller: [ '$scope', 'id', function( $scope, id ) {
                $scope.scene = service.getScenes()[ id ];
                $scope.selectedItem = null;
                $scope.searchText = null;
                $scope.tags = loadTags();
                $scope.selectedTags = $scope.scene.tags;

                /* Search tags */
                $scope.querySearch = function( query ) {
                    var results = query ? $scope.tags.filter( createFilterFor( query ) ) : [];
                    return results;
                }

                /* Create filter function for a query string */
                function createFilterFor( query ) {
                    var lowercaseQuery = angular.lowercase( query );

                    return function filterFn( tag ) {
                        return ( tag._lowername.indexOf( lowercaseQuery ) === 0 ) ||
                            ( tag._lowertype.indexOf( lowercaseQuery ) === 0 );
                    };
                }

                function loadTags() {
                    var tags = service.getTags()
                    return tags.map( function( tag ) {
                        tag._lowername = tag.name.toLowerCase();
                        tag._lowertype = tag.type.toLowerCase();
                        return tag;
                    } );
                }

                $scope.closeDialog = function() {
                    $mdDialog.hide();
                    $scope.scene.tags = $scope.selectedTags
                    service.updateScene( id, $scope.scene )
                    $rootScope.utils.save_edition( service.getSelectedFilm(), service.getScenes() )
                    pause( false )
                }

                $scope.preview = function() {
                    if ( $location.path != '/stream' ) {
                        $location.path( '/stream' );
                    } else {
                        console.log( "will previw again ", id )
                        setTimeout( function() { vm.editScene( id ) }, 5000 );
                    }
                    preview( $scope.scene.start, $scope.scene.end )
                    $scope.closeDialog()
                }

                $scope.remove = function() {
                    $mdDialog.hide();
                    service.removeScene( id )
                    $rootScope.utils.save_edition( service.getSelectedFilm(), service.getScenes() )
                    pause( false )
                }

            } ]
        } )
    }



} );
