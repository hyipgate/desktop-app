angular.module( 'streamCtrl', [ 'ngMaterial' ] )

.controller( 'StreamController', function( $rootScope, $scope, service, $location, $mdDialog ) {
    var vm = this;
    vm.show_menu = "none"

    $scope.show_buttons = function( argument ) {
        vm.show_menu = "block"
        vm.last_moved = Date.now()
    }

    function check() {
        if ( vm.show_menu != "none" && vm.last_moved && vm.last_moved + 2000 < Date.now() ) {
            console.log( "hidding menu" )
            vm.show_menu = "none"
            $rootScope.$apply();
        }
    }

    var interval_id = setInterval( check, 1000 );

    // Listen keyboard events 
    window.onkeyup = function( e ) {
        var key = e.keyCode ? e.keyCode : e.which;
        if ( key == 110 ) {
            var scene = mark_current_time()
            if ( scene ) {
                var index = service.addScene( scene.start, scene.end )
                $scope.main.editScene( index )
            }
        }
    }

    $scope.backToFilm = function( argument ) {
        console.log( "Closing stream controller" )
        end_capture()
        clearInterval( interval_id );
        window.onkeyup = null
        $location.path( '/film' );
        if ( service.getMode() ) {
            $rootScope.utils.save_sync_ref( service.getSelectedFilm(), service.getSyncRef() )
        }
    }



    $scope.sceneList = function( $event ) {
        pause( true )
        $mdDialog.show( {
            targetEvent: $event,
            locals: { editScene: $scope.main.editScene },
            templateUrl: 'views/scene-list-template.html',
            controller: sceneListController
        } )

        function sceneListController( $scope, $mdDialog, editScene ) {

            $scope.scenes = service.getScenes();

            $scope.closeAndEditScene = function( $index, $event ) {
                $mdDialog.hide()
                editScene( $index )
            }

            $scope.newScene = function() {
                var index = service.addScene()
                editScene( index )
            }
        }
    }

} ).filter( 'minutes', function() {
    return function( input ) {
        input = input || 0;
        return Math.floor( input / 60 )
    };
} ).filter( 'seconds', function() {
    return function( start, end ) {
        var len = Math.floor( end - start );
        if ( len > 60 ) {
            var min = Math.floor( len / 60 )
            var str = min + "min " + ( len - 60 * min ) + "s"
        } else {
            var str = len + "s"
        }
        return str
    };
} ).filter( 'tags', function() {
    return function( input ) {
        return input.join( ", " )
    };
} )
