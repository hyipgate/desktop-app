angular.module( 'filmCtrl', [ 'ngMaterial' ] )

.controller( 'FilmController', function( $rootScope, $scope, service, $location, $mdBottomSheet ) {
    var vm = this;

    vm.getMovie = function() {
        vm.movieData = service.getSelectedFilm();
        vm.scenes = service.getScenes();
        vm.movieData.providers = [] // TODO do this in the API
        vm.providers = vm.movieData.providers
        vm.providers.push( { name: "File/DVD", url: "file", icon: './assets/img/file.svg' } )
        vm.providers.push( { name: "Amazon", url: "https://www.youtube.com/watch?v=VoIoEhNmfsM", icon: './assets/img/amazon-instant-video.jpe' } )
        vm.providers.push( { name: "Netflix", url: "https://www.youtube.com/watch?v=VoIoEhNmfsM", icon: './assets/img/netflix.jpe' } )
            //vm.providers.push( { name:"Itunes", url:"file", icon: './assets/img/apple-itunes.jpe'} )
        vm.providers.push( { name: "Google Play", url: "https://www.youtube.com/watch?v=VoIoEhNmfsM", icon: './assets/img/google-play-movies.jpe' } )

        vm.movieData.tags = []

        if ( vm.movieData.images.backdrops[ 0 ] ) {
            vm.css = {
                'background': 'linear-gradient( rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(' + vm.movieData.images.backdrops[ 0 ] + ') no-repeat center center',
                'background-size': 'cover',
            }
        }

        $scope.settings   = $rootScope.utils.get_settings() // this reads a file... store the value...
        console.log( "get_settings from film controller", $scope.settings )
        for (var i = 0; i < vm.scenes.length; i++) {
          for (var j = 0; j < vm.scenes[i].tags.length; j++) {
            if( $scope.settings.unwanted_tags.indexOf( vm.scenes[i].tags[j].name ) != -1 ){
              vm.scenes[i].skip = true
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
            controller: 'FilmController as film'
        } ).then( function( clickedItem ) {
            console.log( clickedItem + ' clicked!' );
        } );
    };

    vm.playFile = function ( event ) {
        var file = event.target.files;
        $mdBottomSheet.hide( file[0].path );
        $location.path( '/stream' );
        load_film( "file:///"+file[0].path, vm.scenes, service.getMode(), service.getSyncRef() )
    }

    vm.listItemClick = function( $index ) {
        var clickedItem = vm.movieData.providers[ $index ]
        if ( clickedItem.url == "file" ) {
            var input = document.getElementById('fileInput')
            input.onchange = vm.playFile
            input.click()            
            return;
        }
        $mdBottomSheet.hide( clickedItem.name );
        $location.path( '/stream' );
        //if (!$rootScope.$$phase) $rootScope.$apply();
        load_film( clickedItem.url, vm.scenes, service.getMode(), service.getSyncRef() )
    };

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
} ).filter( 'time', function() {
    return function( start, end ) {
        return Math.floor( end - start )
    };
} ).filter( 'tags', function() {
    return function( input ) {
        return input.join( ", " )
    };
} )
