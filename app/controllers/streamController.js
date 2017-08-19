angular.module( 'streamCtrl', [ 'ngMaterial' ] )

.controller( 'StreamController', function( $rootScope, $scope, service, $location, $mdDialog ) {
    var vm = this;
    vm.src = $rootScope.file

///////////////////////////////////////////////////
//-------- Control buttons over player ----------//
///////////////////////////////////////////////////
    
    vm.isDumpable = ( (vm.src).indexOf("file:///") == 0 )? "block":"none";
    console.log( vm.src, vm.isDumpable )

    vm.show_menu = "none"
    vm.health_color = "rgba(200, 200, 200, 0.6)"

    $scope.show_buttons = function( argument ) {
        vm.show_menu = "block"
        vm.last_moved = Date.now()
    }

// Check periodically to: (1) hide controls if unactive, (2) show controls in red if film is out of sync
    function check() {
    // Check we are on sync
        var illness = health_report()
        if ( illness > 5000 ) {
            vm.show_menu = "block"
            var red = Math.min( 255, Math.floor( illness/100 ) )     // Red color
            var oth = Math.min( 0, 200 - Math.floor( illness/200 ) ) // Others (blue and green) color
            var opa = Math.min( 1, Math.floor( illness/2500 )/10 )   // Opacity
            vm.health_color = "rgba("+red+", "+oth+", "+oth+","+opa+")"
            $rootScope.$apply();
            return
        }
    // Check last activity and hide controls if needed
        if ( vm.show_menu != "none" && vm.last_moved && vm.last_moved + 2000 < Date.now() ) {
            vm.show_menu = "none"
            vm.health_color = "rgba(200, 200, 200, 0.6)"
            $rootScope.$apply();
        }
    }
    var interval_id = setInterval( check, 2500 );



///////////////////////////////////////////////////
//---- Listen to keyboard "mark time" events ----//
///////////////////////////////////////////////////
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

///////////////////////////////////////////////////
//------ Stop ALL stream related timers... ------//
/////////////////////////////////////////////////// 
    $scope.backToFilm = function( argument ) {
        console.log( "Closing stream controller" )
        end_capture()
        clearInterval( interval_id );
        window.onkeyup = null
        $location.path( '/film' );
        if ( service.getMode() ) { // If we are on edit mode, save reference
            $rootScope.utils.save_sync_ref( service.getSelectedFilm(), service.getSyncRef() )
        }
    }



///////////////////////////////////////////////////
//-------------- Show Scene List Dialog ---------//
/////////////////////////////////////////////////// 
    $scope.sceneList = function( $event ) {
        pause( true )
        $mdDialog.show( {
            targetEvent: $event,
            locals: { editScene: $scope.main.editScene, isDumpable: vm.isDumpable },
            templateUrl: 'views/scene-list-template.html',
            controller: sceneListController
        } )

        function sceneListController( $scope, $mdDialog, editScene, isDumpable ) {

            $scope.isDumpable = isDumpable
            console.log( isDumpable)

            $scope.scenes = service.getScenes();

            $scope.closeAndEditScene = function( $index, $event ) {
                $mdDialog.hide()
                editScene( $index )
            }

            $scope.newScene = function() {
                var index = service.addScene()
                editScene( index )
            }

            $scope.dumpToFile = function () {
                var file = $rootScope.electron.remote.require( './app/assets/js/file' );

                console.log( $scope )

                var skip_list = []
                for (var i = 0; i < $scope.scenes.length; i++) {
                    if( $scope.scenes[i].skip ) skip_list.push( $scope.scenes[i] )
                }
                var input = $rootScope.file
                var output = input.replace(/\.([^.]+)$/g,"_CUSTOM.$1")
                
                console.log( input, skip_list, output )

                file.dumpToFile( input, skip_list, output )
                $mdDialog.hide()
            }
        }
    }


// Some filters
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
} ).config(function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        'https://**',
        'http://**',
        'file:///**'
  ]);
})
