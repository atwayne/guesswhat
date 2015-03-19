'use strict';

var guessApp = angular.module('guessApp', []);

// create the controller and inject Angular's $scope
guessApp.controller('MainCtrl', function ($scope, $interval) {

    $scope.seconds = 0;

    $scope.current = null;

    $scope.pending = ['word1', 'word2'];

    $scope.skipped = [];

    $scope.completed = [];

    $scope.GetPendingCount = function () {
        return $scope.pending.length;
    };

    $scope.GetCompletedCount = function () {
        return $scope.completed.length;
    };

    $scope.GetSkippedCount = function () {
        return $scope.skipped.length;
    };

    $scope.MoveNext = function () {
        $scope.pending = _.without($scope.pending, $scope.current);
        $scope.completed.push($scope.current);
        $scope.GetRandomWord();
    };

    $scope.Skip = function () {
        $scope.pending = _.without($scope.pending, $scope.current);
        $scope.skipped.push($scope.current);
        $scope.GetRandomWord();
    };

    $scope.GetRandomWord = function () {
        var random = _.random(0, $scope.pending.length - 1);
        var word = $scope.pending[random];
        $scope.current = word;
        $scope.pending = _.without($scope.pending, word);
    };

    $scope.GetRandomWord();

    var stop;
    $scope.Start = function () {
        if (angular.isDefined(stop)) return;
        stop = $interval(function () { $scope.seconds++; }, 1000);
    };

    $scope.Stop = function () {
        if (angular.isDefined(stop)) {
            $interval.cancel(stop);
            stop = undefined;
        }
    };

    $scope.IsRunning = function () {
        return angular.isDefined(stop);
    };

    $scope.IsCompleted = function () {
        var result = $scope.pending.length == 0 && $scope.current == null;
        if (result)
            $scope.Stop();

        return result;
    };

    $scope.GetSeconds = function () {
        var digit = $scope.seconds % 60;
        return digit >= 10 ? digit.toString() : '0' + digit;
    };

    $scope.GetMinutes = function () {
        var digit = Math.floor($scope.seconds / 60) % 60;
        return digit >= 10 ? digit.toString() : '0' + digit;
    };

    $scope.GetHours = function () {
        var digit = Math.floor($scope.seconds / 3600);
        return digit >= 10 ? digit.toString() : '0' + digit;
    };
});