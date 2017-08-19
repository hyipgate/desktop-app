angular.module( 'configCtrl', [ 'ngMaterial' ] )

.controller( 'ConfigController', function( $rootScope, $scope, service, $location, $mdBottomSheet, $mdDialog ) {
    var vm = this;
    $scope.settings  = $rootScope.utils.get_settings() // this reads a file... store the value...

    $rootScope.saveSettings = function() {
        console.log( "saving data ", $scope.settings )
        $rootScope.utils.set_settings( $scope.settings )
    }

    vm.logIn = function( ev ) {
        $mdDialog.show( {
            template: '<md-dialog layout="column" md-theme="darkTheme">' +
                '  <md-dialog-content>' +
                '    <md-content layout="column" layout-padding>' +
                '      <md-input-container style="margin:15px 0 0 0;"><label>Username</label><input type="text" ng-model="name"/></md-input-container>' +
                '      <md-input-container style="margin:0;"><label>Password</label><input type="password" ng-model="pass"/></md-input-container>' +
                '  </md-dialog-content>' +
                '  <md-dialog-actions>' +
                '    <md-button ng-click="cancel()">Cancel</md-button>' +
                '    <md-button ng-click="login()" class="md-primary">Log In</md-button>' +
                '  </md-dialog-actions>' +
                '</md-dialog>',
            targetEvent: ev,
            locals: { username: $scope.settings.username },
            controller: LogInDialogController
        } )

        function LogInDialogController( $scope, $mdDialog, username ) {
            $scope.name = username
            $scope.pass = ""

            $scope.cancel = function() {
                console.log( "cancel" )
                $mdDialog.hide();
            }

            $scope.login = function() {
                console.log( "cancel" )
                console.log( $scope.name, $scope.pass )
                $rootScope.utils.log_in( $scope.name, $scope.pass ).then( function( answer ) {
                    if ( answer[ "status" ] && answer[ "status" ] == 200 ) {
                        $rootScope.openToast( "You are in!" )
                        $mdDialog.hide()
                    } else {
                        $rootScope.openToast( answer.data )
                    }
                } )
            }
        }
    }

    vm.newUser = function( ev ) {
        $mdDialog.show( {
            template: '<md-dialog layout="column" md-theme="darkTheme">' +
                '  <md-dialog-content>' +
                '    <md-content layout="column" layout-padding>' +
                '      <md-input-container style="margin:15px 0 0 0;"><label>Username</label><input type="text" ng-model="name"/></md-input-container>' +
                '      <md-input-container style="margin:0;"><label>Password</label><input type="password" ng-model="pass"/></md-input-container>' +
                '      <md-input-container style="margin:0;"><label>Email</label><input type="text" ng-model="email"/></md-input-container>' +
                '  </md-dialog-content>' +
                '  <md-dialog-actions>' +
                '    <md-button ng-click="cancel()">Cancel</md-button>' +
                '    <md-button ng-click="create()" class="md-primary">Create</md-button>' +
                '  </md-dialog-actions>' +
                '</md-dialog>',
            targetEvent: ev,
            controller: NewUserDialogController
        } )

        function NewUserDialogController( $scope, $mdDialog ) {
            $scope.name = ""
            $scope.pass = ""
            $scope.email= ""

            $scope.cancel = function() {
                console.log( "cancel" )
                $mdDialog.hide();
            }

            $scope.create = function() {
                console.log( "create" )
                console.log( "create new user: ",$scope.name," -> ", $scope.email )
                $rootScope.utils.new_user( $scope.name, $scope.pass, $scope.email ).then( function( answer ) {
                    if ( answer[ "status" ] && answer[ "status" ] == 200 ) {
                        $rootScope.openToast( "Welcome!" )
                        $mdDialog.hide()
                    } else {
                        $rootScope.openToast( answer.data )
                    }
                } )
            }
        }
    }


    vm.newPass = function( ev ) {
        $mdDialog.show( {
            template: '<md-dialog layout="column" md-theme="darkTheme">' +
                '  <md-dialog-content>' +
                '    <md-content layout="column" layout-padding>' +
                '      <md-input-container style="margin:15px 0 0 0;"><label>Username</label><input type="text" ng-model="name"/></md-input-container>' +
                '      <md-input-container style="margin:0;"><label>Old Pass</label><input type="password" ng-model="oldpass"/></md-input-container>' +
                '      <md-input-container style="margin:0;"><label>New Pass</label><input type="password" ng-model="pass"/></md-input-container>' +
                '  </md-dialog-content>' +
                '  <md-dialog-actions>' +
                '    <md-button ng-click="cancel()">Cancel</md-button>' +
                '    <md-button ng-click="updatepass()" class="md-primary">Update Pass</md-button>' +
                '  </md-dialog-actions>' +
                '</md-dialog>',
            targetEvent: ev,
            locals: { username: $scope.settings.username },
            controller: LogInDialogController
        } )

        function LogInDialogController( $scope, $mdDialog, username ) {
            $scope.name = username
            $scope.oldpass = ""
            $scope.pass = ""

            $scope.cancel = function() {
                console.log( "cancel" )
                $mdDialog.hide();
            }

            $scope.updatepass = function() {
                console.log( "Updating pass ",$scope.name )
                $rootScope.utils.new_pass( $scope.name, $scope.oldpass, $scope.pass ).then( function( answer ) {
                    if ( answer[ "status" ] && answer[ "status" ] == 200 ) {
                        $mdDialog.hide()
                        $rootScope.openToast( "Password updated!" )
                    } else {
                        $rootScope.openToast( answer.data )
                    }
                } )
            }
        }
    }


} )
