'use strict';

angular.module('automationApp.scriptor')
	.controller('ScriptEditorController', ['$stateParams', '$rootScope', '$scope', 'scriptorService', '$timeout', '$state',
		function($stateParams, $rootScope, $scope, scriptorService, $timeout, $state) {
            var taskData;
            $scope.sleId = $stateParams.id;

            if($rootScope.globalConstants === undefined) {
                scriptorService.getTaskJson($stateParams.id).then(function(res) {
                    taskData = res.data.task_json;
                    $scope.taskJson =  taskData;
                    $scope.originalTaskJson = angular.copy(taskData);

                    scriptorService.taskContent = taskData;
                    $rootScope.taskId = $scope.taskId = taskData[0].id;
                });

                scriptorService.getGlobalContext().then(function(res) {
                    $rootScope.globalConstants = res.data;

                    var taskMetadata = scriptorService.getApplicationFromScenarioId($scope.sleId, $rootScope.globalConstants);

                    $rootScope.applicationName = $scope.applicationName = taskMetadata.application.label;
                    $scope.scenarioType = taskMetadata.scenario;
                    $scope.taskId = taskMetadata.taskId;

                    scriptorService.getTriggers().then(function(res) {
                        var commonActions = res.data["common"];
                        var appSpecificActions = res.data[$rootScope.applicationName];

                        $rootScope.triggers = commonActions.concat(appSpecificActions);
                    });

                    scriptorService.getXpathArrayList($rootScope.applicationName).then(function(res) {
                        $rootScope.xpathArrayList = res;
                        $rootScope.getXPathForElement = scriptorService.getXPathForElement;
                    });
                });
            } else {
                taskData = scriptorService.taskContent;
                $scope.taskJson = taskData;
                $scope.originalTaskJson = angular.copy(taskData);

                $rootScope.taskId = $scope.taskId = taskData[0].id;
                $scope.scenarioType = taskData[0].scenario;
                $rootScope.applicationName = $scope.applicationName = taskData[0].appName;

                scriptorService.getTriggers().then(function(res) {
                    var commonActions = res.data["common"];
                    var appSpecificActions = res.data[$rootScope.applicationName];

                    $rootScope.triggers = commonActions.concat(appSpecificActions);
                });

                scriptorService.getXpathArrayList($rootScope.applicationName).then(function(res) {
                    $rootScope.xpathArrayList = res;
                    $rootScope.getXPathForElement = scriptorService.getXPathForElement;
                });
            }

            scriptorService.getTriggerSuggestions().then(function(res) {
                $rootScope.TriggerSuggestions = res.data;
            });

            $scope.$watch('taskJson',function(newValue, oldValue) {
                if(newValue != oldValue) {
                    if(!angular.equals($scope.taskJson,$scope.originalTaskJson)) {
                        scriptorService.updateTaskJson($scope.sleId, $scope.taskJson, username).then(function(res) {
                            $scope.originalTaskJson =  res.data.task_json;
                        });
                    }
                }
            },true);

            $scope.$on('SCRIPTOR_LOAD_TASK', function(event, res) {
                scriptorService.taskContent = res.data.task_json;
                $state.go('app.script-editor',  {id: res.data.sle_id});
                $scope.showNotify('<div class="alert alert-success m-r-30"><p><strong>' + 'Task data loaded successfully !' + '</p></div>');
            });

            $scope.editableiteminput = {
                editorenabled : -1,

                enableEditor : function(index) {
                    $scope.editableiteminput.editorenabled = index;
                },

                disableEditor : function(index,event) {
                    $scope.editableiteminput.editorenabled = index;
                    event.stopPropagation();
                },

                save : function() {
                this.disableEditor();
                },

                stopEvent : function(event) {
                    event.stopPropagation();
                }
            };

		}]);
