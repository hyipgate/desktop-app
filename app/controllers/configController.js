angular.module('configCtrl', ['ngMaterial'])

    .controller('ConfigController', function($rootScope, $scope, $location, $mdBottomSheet, $mdDialog) {
        var vm = this;

        vm.newUser = function(ev) {
            $mdDialog.show({
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
            })

            function NewUserDialogController($scope, $mdDialog) {
                $scope.name = ""
                $scope.pass = ""
                $scope.email = ""

                $scope.cancel = function() {
                    console.log("cancel")
                    $mdDialog.hide();
                }

                $scope.create = function() {
                    console.log("create")
                    console.log("create new user: ", $scope.name, " -> ", $scope.email)
                    $rootScope.utils.new_user($scope.name, $scope.pass, $scope.email).then(function(answer) {
                        if (answer["status"] && answer["status"] == 200) {
                            $rootScope.openToast("Welcome!")
                            $mdDialog.hide()
                        } else {
                            $rootScope.openToast(answer.data)
                        }
                    })
                }
            }
        }


        vm.newPass = function(ev) {
            $mdDialog.show({
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
                locals: { username: $rootScope.settings.username },
                controller: LogInDialogController
            })

            function LogInDialogController($scope, $mdDialog, username) {
                $scope.name = username
                $scope.oldpass = ""
                $scope.pass = ""

                $scope.cancel = function() {
                    console.log("cancel")
                    $mdDialog.hide();
                }

                $scope.updatepass = function() {
                    console.log("Updating pass ", $scope.name)
                    $rootScope.utils.new_pass($scope.name, $scope.oldpass, $scope.pass).then(function(answer) {
                        if (answer["status"] && answer["status"] == 200) {
                            $mdDialog.hide()
                            $rootScope.openToast("Password updated!")
                        } else {
                            $rootScope.openToast(answer.data)
                        }
                    })
                }
            }
        }

        vm.possibleRegions = [{
                'name': 'Auto',
                'identifier': 'auto',
            },
            {
                'name': 'Australia',
                'identifier': 'AU',
            },
            {
                'name': 'Austria',
                'identifier': 'AT',
            },
            {
                'name': 'Brazil',
                'identifier': 'BR',
            },
            {
                'name': 'Canada',
                'identifier': 'CA',
            },
            {
                'name': 'Denmark',
                'identifier': 'DK',
            },
            {
                'name': 'Estonia',
                'identifier': 'EE',
            },
            {
                'name': 'Finland',
                'identifier': 'FI',
            },
            {
                'name': 'France',
                'identifier': 'FR',
            },
            {
                'name': 'Germany',
                'identifier': 'DE',
            },
            {
                'name': 'India',
                'identifier': 'IN',
            },
            {
                'name': 'Ireland',
                'identifier': 'IE',
            },
            {
                'name': 'Italy',
                'identifier': 'IT',
            },
            {
                'name': 'Japan',
                'identifier': 'JP',
            },
            {
                'name': 'Latvia',
                'identifier': 'LV',
            },
            {
                'name': 'Lithuania',
                'identifier': 'LT',
            },
            {
                'name': 'Malaysia',
                'identifier': 'MY',
            },
            {
                'name': 'Mexico',
                'identifier': 'MX',
            },
            {
                'name': 'Netherlands',
                'identifier': 'NL',
            },
            {
                'name': 'New Zealand',
                'identifier': 'NZ',
            },
            {
                'name': 'Norway',
                'identifier': 'NO',
            },
            {
                'name': 'Philippines',
                'identifier': 'PH',
            },
            {
                'name': 'Russia',
                'identifier': 'RU',
            },
            {
                'name': 'Singapore',
                'identifier': 'SG',
            },
            {
                'name': 'South Africa',
                'identifier': 'ZA',
            },
            {
                'name': 'South Korea',
                'identifier': 'KR',
            },
            {
                'name': 'Spain',
                'identifier': 'ES',
            },
            {
                'name': 'Sweden',
                'identifier': 'SE',
            },
            {
                'name': 'Switzerland',
                'identifier': 'CH',
            },
            {
                'name': 'Thailand',
                'identifier': 'TH',
            },
            {
                'name': 'United Kingdom',
                'identifier': 'GB',
            },
            {
                'name': 'USA',
                'identifier': 'US',
            },
        ];

    })