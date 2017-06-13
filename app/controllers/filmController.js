angular.module( 'filmCtrl', [ 'ngMaterial' ] )

.controller( 'FilmController', function( $rootScope, $scope, service, $location, $mdBottomSheet ) {
    var vm = this;

    vm.getMovie = function() {
        vm.movieData = service.getSelectedFilm();
        vm.scenes = service.getScenes();
        vm.movieData.tags = []

        if ( vm.movieData.images.backdrops[ 0 ] ) {
            vm.css = {
                'background': 'linear-gradient( rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(' + vm.movieData.images.backdrops[ 0 ] + ') no-repeat center center',
                'background-size': 'cover',
            }
        }

        $scope.settings   = $rootScope.utils.get_settings() // this reads a file... store the value...
        console.log( "get_settings from film controller" )
        var skip_tags = $scope.settings.tags.filter( function ( tag ) { return tag.skip })
        var list_tags = $scope.settings.tags.filter( function ( tag ) { return tag.list })

        for (var i = 0; i < vm.scenes.length; i++) {
            vm.scenes[i].skip = false
            //console.log( "scene tags: ",vm.scenes[i].tags )
            for (var j = 0; j < skip_tags.length; j++) {
                //console.log( "check skip: ",skip_tags[j].name )
                if( vm.scenes[i].tags.indexOf( skip_tags[j].name ) != -1 ){
                  vm.scenes[i].skip = true; console.log( "yes");
                  break  
                } 
            }
            vm.scenes[i].list = vm.scenes[i].skip
            for (var j = 0; j < list_tags.length; j++) {
                //console.log( "check list: ",list_tags[j].name )
                if( vm.scenes[i].tags.indexOf( list_tags[j].name ) != -1 ){
                    vm.scenes[i].list = true; console.log( "yes");
                    break
                }
            }
        }
    }

    vm.getMovie();

    $scope.showListBottomSheet = function( mode ) {
        service.setMode( mode )
        $scope.alert = '';
        $mdBottomSheet.show( {
            templateUrl: 'views/bottom-sheet-list-template.html',
            locals: { scenes: vm.scenes },
            controller: BottonSheetDialogController
        } )

        function BottonSheetDialogController( $scope, scenes, $mdDialog ) {
            var vm = this
            vm.movieData = service.getSelectedFilm();
            $scope.providers = vm.movieData.providers
            $scope.providers.push( { name: "Youtube", url: "https://www.youtube.com/watch?v=VoIoEhNmfsM", icon: 'google-play' } )
            $scope.providers.push( { name: "File/DVD", url: "file", icon: 'file.svg' } )
            
            
            $scope.playFile = function ( event ) {
                var file = event.target.files;
                $mdBottomSheet.hide( file[0].path );
                $location.path( '/stream' );
                load_film( "file:///"+file[0].path, scenes, service.getMode(), service.getSyncRef() )
            }

            $scope.listItemClick = function( $index ) {
                console.log( $index )
                var clickedItem = $scope.providers[ $index ]
                if ( clickedItem.url == "file" ) {
                    var input = document.getElementById('fileInput')
                    input.onchange = vm.playFile
                    input.click()            
                    return;
                }
                $mdBottomSheet.hide( clickedItem.name );
                $location.path( '/stream' );
                //if (!$rootScope.$$phase) $rootScope.$apply();
                load_film( clickedItem.url, scenes, service.getMode(), service.getSyncRef() )
            };
        }
    }

    $scope.backToSearch = function( argument ) {
        $location.path( '/' );
    }

    vm.newScene = function( argument ) {
        var index = service.addScene()
        $scope.main.editScene( index )
    }

    vm.share = function() {
        $rootScope.utils.share_scenes( service.getSelectedFilm() ).then( function( answer ) {
            if ( typeof answer.data === 'string' ) {
                $rootScope.openToast( answer.data )
            }
            console.log( response )
        } )
    }

} ).filter( 'minutes', function() {
    return function( input ) {
        input = input || 0;
        return Math.floor( input / 60 )
    };
} ).filter( 'seconds', function() {
    return function( start, end ) {
        var len = Math.floor(end - start);
        console.log( len )
        if( len > 60 ){
            var min = Math.floor(len/60)
            var str = min+"min "+(len-60*min)+"s"
        } else{
            var str = len+"s"
        }
        return str
    };
} ).filter( 'tags', function() {
    return function( input ) {
        return input.join( ", " )
    };
} )
