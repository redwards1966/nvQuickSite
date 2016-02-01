﻿"use strict";

codeCampControllers.controller("agendaController", ["$scope", "$routeParams", "$http", "$location", "codeCampServiceFactory", function ($scope, $routeParams, $http, $location, codeCampServiceFactory) {
    
    var factory = codeCampServiceFactory;
    factory.init(moduleId, moduleName);

    $scope.eventDays = [];
    $scope.sessions = [];

    $scope.LoadData = function () {
        factory.callGetService("GetEventByModuleId")
            .then(function (response) {
                var fullResult = angular.fromJson(response);
                var serviceResponse = JSON.parse(fullResult.data);

                $scope.codeCamp = serviceResponse.Content;

                if ($scope.codeCamp != null) {
                    $scope.codeCamp.BeginDate = ParseDate($scope.codeCamp.BeginDate);
                    $scope.codeCamp.EndDate = ParseDate($scope.codeCamp.EndDate);
                }

                if ($scope.codeCamp === null) {
                    $scope.hasCodeCamp = false;
                } else {
                    $scope.hasCodeCamp = true;

                    $scope.LoadEditPermissions();
                }

                var beginMoment = moment($scope.codeCamp.BeginDate);
                var endMoment = moment($scope.codeCamp.EndDate);
                $scope.eventLength = endMoment.diff(beginMoment, "days") + 1;

                for (var i = 0; i < $scope.eventLength; i++) {
                    var newDay = {};
                    var newMoment = moment(beginMoment.format("MM/DD/YYYY"));

                    if (i > 0) {
                        newMoment = newMoment.add(i, "days");
                    }

                    newDay.Index = i;
                    newDay.Month = newMoment.format("MMM");
                    newDay.DayName = newMoment.format("dddd");
                    newDay.DayNumber = newMoment.format("DD");
                    newDay.Date = newMoment.format("MM/DD/YYYY");
                    newDay.Year = newMoment.format("YYYY");

                    $scope.eventDays.push(newDay);
                }

                LogErrors(serviceResponse.Errors);
            },
                function (data) {
                    console.log("Unknown error occurred calling GetEventByModuleId");
                    console.log(data);
                });
    }

    $scope.LoadEditPermissions = function () {
        factory.callGetService("UserCanEditEvent?itemId=" + $scope.codeCamp.CodeCampId)
            .then(function (response) {
                var fullResult = angular.fromJson(response);
                var serviceResponse = JSON.parse(fullResult.data);

                $scope.userCanEdit = (serviceResponse.Content == "Success");

                $scope.LoadTracks();

                LogErrors(serviceResponse.Errors);
            },
            function (data) {
                console.log("Unknown error occurred calling UserCanEditEvent");
                console.log(data);
            });
    }

    $scope.LoadTracks = function () {
        factory.callGetService("GetTracks?codeCampId=" + $scope.codeCamp.CodeCampId)
            .then(function (response) {
                var fullResult = angular.fromJson(response);
                var serviceResponse = JSON.parse(fullResult.data);

                $scope.tracks = serviceResponse.Content;

                $.each($scope.tracks, function (i, track) {
                    track.TrackSlug = GetSlugFromValue(track.Title);
                });

                $scope.LoadTimeSlots();

                LogErrors(serviceResponse.Errors);
            },
            function (data) {
                console.log("Unknown error occurred calling GetTracks");
                console.log(data);
            });
    };

    $scope.LoadTimeSlots = function () {
        factory.callGetService("GetTimeSlots?codeCampId=" + $scope.codeCamp.CodeCampId)
            .then(function (response) {
                var fullResult = angular.fromJson(response);
                var serviceResponse = JSON.parse(fullResult.data);

                $scope.timeSlots = serviceResponse.Content;

                angular.forEach($scope.timeSlots, function (timeSlot, index) {
                    var beginDateTime = moment(timeSlot.BeginTime);

                    timeSlot.BeginTime = moment(timeSlot.BeginTime).format("hh:mm A");
                    timeSlot.EndTime = moment(timeSlot.EndTime).format("hh:mm A");

                    var seconds = beginDateTime.seconds();
                    var minutes = beginDateTime.minutes();
                    var hours = beginDateTime.hours();

                    timeSlot.sortTime = hours * 60 * 60 + minutes * 60 + seconds;
                });

                $scope.LoadSessions();

                LogErrors(serviceResponse.Errors);
            },
                function (data) {
                    console.log("Unknown error occurred calling GetTimeSlots");
                    console.log(data);
                });
    }

    $scope.LoadSessions = function () {
        var availableTimeSlotCount = $scope.timeSlots.length;
        var i = 0;

        angular.forEach($scope.timeSlots, function(timeSlot, index) {
            $scope.LoadSessionsByTimeSlotId(timeSlot.TimeSlotId);
            i++;
        });
    }

    $scope.LoadSessionsByTimeSlotId = function (timeSlotId) {
        factory.callGetService("GetSessionsByTimeSlotId?timeSlotId=" + timeSlotId + "&codeCampId=" + $scope.codeCamp.CodeCampId)
            .then(function (response) {
                var fullResult = angular.fromJson(response);
                var serviceResponse = JSON.parse(fullResult.data);

                var timeSlotSessions = serviceResponse.Content;

                $scope.sessions[timeSlotId] = timeSlotSessions;

                LogErrors(serviceResponse.Errors);

                return timeSlotSessions;
            },
                function (data) {
                    console.log("Unknown error occurred calling GetSessionsByTimeSlotId");
                    console.log(data);
                    return null;
                });
    };

    $scope.goToPage = function (pageName) {
        $location.path(pageName);
    }

    $scope.LoadData();

}]);