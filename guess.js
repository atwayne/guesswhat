'use strict';

var guessApp = angular.module('guessApp', ['ngRoute']);

guessApp.factory('WordService', function () {
    var wordList = {
        'Animal1': ['Dog', 'Bird', 'Human'],
        'Planet2': ['Earth', 'Mars'],
        'Planet3': ['Earth', 'Mars'],
        'Planet4': ['Earth', 'Mars'],
        'Planet5': ['Earth', 'Mars'],
        'Planet6': ['Earth', 'Mars'],
        'Planet7': ['Earth', 'Mars'],
        'Planet8': ['Earth', 'Mars'],
        'Planet9': ['Earth', 'Mars'],
        'Planet10': ['Earth', 'Mars']
    };

    var completed = [];

    var getCategories = function () {
        return _.keys(_.omit(wordList, completed));
    };

    var getWords = function (category) {
        completed.push(category);
        return wordList[category];
    };

    return {
        getCategories: getCategories,
        getWords: getWords
    };
});

guessApp.controller('CategoryCtrl', function ($scope, $window, WordService) {
    $scope.categories = WordService.getCategories();
    $scope.goto = function (category) {
        $window.location.href = "#/word/" + category;
    };
});

guessApp.controller('MainCtrl', function ($scope, $interval, $routeParams, WordService) {

    var category = $routeParams.categoryName;

    $scope.seconds = 0;

    $scope.current = null;

    $scope.pending = WordService.getWords(category);

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
        stop = $interval(function () {
            $scope.seconds++;
        }, 1000);
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

guessApp.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/word/:categoryName', {
            templateUrl: 'guesswhat.html',
            controller: 'MainCtrl'
        })
        .when('/category', {
            templateUrl: 'category.html',
            controller: 'CategoryCtrl'
        })
        .otherwise({redirectTo: '/category'});
}]);