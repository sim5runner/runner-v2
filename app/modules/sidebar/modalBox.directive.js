/**
 * Created by piyush on 9/21/2016.
 */

"use strict";

angular.module('automationApp.sidebar')
    .directive('modalBox', ['scriptorService','$location','$rootScope', '$window',function(scriptorService,$location,$rootScope, $window) {
        return {
            restrict: 'AE',
            replace: true,
            scope:{
            },
            templateUrl: 'modules/sidebar/modalBox.tpl.html',
            link: function($scope, element, attrs) {

                var modalData = {
                    headerText:'',
                    confirmText:'',
                    route:'',
                    queryParam:''
                };

                $('#modal-modalbox').on('show.bs.modal', function (event) {
                    var thisModal = $(this);
                    var listItem = $(event.relatedTarget) // Button that triggered the modal

                    if(listItem.data('context') == 'export') {
                        modalData.headerText = 'Export Script';
                        modalData.confirmText = 'Export';
                        modalData.route = '/api/tasks/';
                        modalData.queryParam = '?mode=export';
                    }
                    else if(listItem.data('context') == 'preview') {
                        modalData.headerText = 'Preview XML';
                        modalData.confirmText = 'Preview';
                        modalData.route = '/api/xml/';
                    }
                    else {
                        modalData.headerText = '';
                        modalData.confirmText = 'Continue';
                    }

                    thisModal.find('#headerText span').text(modalData.headerText);
                    thisModal.find('#confirmText').text(modalData.confirmText);

                    $scope.clickAction = function(){

                        var taskID = thisModal.find("[id='taskid']").val();

                        if (taskID == undefined || taskID.length === 0) {
                            $rootScope.showNotify('<div class="alert alert-danger"><p><strong>' + 'SLE Id cannot be blank !' + '</p></div>','.modal-body');
                        }
                        else if ($rootScope.validateTaskId(taskID)){	// client side validation
                            // api call
                            scriptorService.getTaskJson(taskID).then(function(res) {
                                if(res.data.errors) {
                                    $rootScope.showNotify('<div class="alert alert-danger"><p><strong>Error in getting data for SLE - </p>'+taskID+'</div>','.modal-body');
                                } else{
                                    thisModal.find("[id='taskid']").val('');  // reset input field
                                    $('#modal-modalbox').modal('hide');  // hide modal
                                    $window.open($location.protocol() + "://" + $location.host() + ':' + $location.port() + modalData.route + taskID + modalData.queryParam);
                                }
                            });
                        } else{
                            $rootScope.showNotify('<div class="alert alert-danger"><p><strong>' + 'Invalid Task Id !' + '</p></div>','.modal-body');
                        }
                    }
                })
            }
        };
    }]);
