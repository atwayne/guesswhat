'use strict';

var guessApp = angular.module('guessApp', ['ngRoute']);

guessApp.factory('GameService', function () {
    var modes = [
        {
            Name: 'Normal Mode',
            Score: function (successful, skipped, remaining, seconds) {
                var score = (1680 - seconds - (remaining + skipped) * 60) / 1680 * 100;
                return parseInt(score);
            },
            TotalSeconds: 8 * 60
        },
        {
            Name: 'Arcade Mode',
            Score: function (successful, skipped, remaining, seconds) {
                var score = successful / 20 * 100;
                return parseInt(score);
            },
            TotalSeconds: 4 * 60
        },
        {
            Name: 'One Piece Mode',
            Score: function (successful, skipped, remaining, seconds) {
                return successful * 10;
            },
            TotalSeconds: 2 * 60
        }
    ];

    var defaultMode = 'Normal Mode';

    var getModeNames = function () {
        return _.map(modes, function (item) { return item.Name; });
    };

    var getModeByName = function (name) {
        return _.findWhere(modes, { Name: name });
    };

    var currentMode = getModeByName(defaultMode);

    var setMode = function (mode) {
        currentMode = mode;
    };

    var getCurrentMode = function () {
        return currentMode;
    };

    var getNextMode = function (name) {
        var index = _.findIndex(modes, { Name: name });
        var next = (index + 1) % modes.length;
        return modes[next];
    };

    var getPreviousMode = function (name) {
        var index = _.findIndex(modes, { Name: name });
        var previous = (index - 1 + modes.length) % modes.length;
        return modes[previous];
    };

    var getScore = function (successful, skipped, remaining, seconds) {
        return currentMode.Score(successful, skipped, remaining, seconds);
    };

    return {
        getModeNames: getModeNames,
        getCurrentMode: getCurrentMode,
        setMode: setMode,
        getNextMode: getNextMode,
        getPreviousMode: getPreviousMode,
        getScore: getScore
    };
});

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

guessApp.controller('CategoryCtrl', function ($scope, $window, WordService, GameService) {
    $scope.modes = GameService.getModeNames();
    $scope.currentMode = GameService.getCurrentMode();
    $scope.setMode = function (name) {
        GameService.setMode(name);
        $scope.currentMode = name;
    };

    $scope.NextMode = function () {
        var currentMode = $scope.currentMode;
        var nextMode = GameService.getNextMode(currentMode.Name);
        $scope.setMode(nextMode);
    };
    $scope.PreviousMode = function () {
        var currentMode = $scope.currentMode;
        var nextMode = GameService.getPreviousMode(currentMode.Name);
        $scope.setMode(nextMode);
    };

    $scope.categories = WordService.getCategories();
    $scope.goto = function (category) {
        $window.location.href = "#/word/" + category;
    };
});

guessApp.controller('MainCtrl', function ($scope, $interval, $routeParams, WordService, GameService) {
    var category = $routeParams.categoryName;

    $scope.currentMode = GameService.getCurrentMode();

    $scope.seconds = 0;

    $scope.extraSeconds = 0;

    $scope.remainingSeconds = function () {
        var remaingSeconds = $scope.currentMode.TotalSeconds + $scope.extraSeconds - $scope.seconds;
        return remaingSeconds < 0 ? 0 : remaingSeconds;
    };

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
        var noMoreWords = $scope.pending.length == 0 && $scope.current == null;
        var timeIsUp = $scope.remainingSeconds() <= 0;

        if (!noMoreWords && !timeIsUp) {
            return false;
        }

        $scope.Stop();
        return true;
    };

    $scope.GetSeconds = function () {
        var digit = $scope.remainingSeconds() % 60;
        return digit >= 10 ? digit.toString() : '0' + digit;
    };

    $scope.GetMinutes = function () {
        var digit = Math.floor($scope.remainingSeconds() / 60) % 60;
        return digit >= 10 ? digit.toString() : '0' + digit;
    };

    $scope.GetHours = function () {
        var digit = Math.floor($scope.remainingSeconds() / 3600);
        return digit >= 10 ? digit.toString() : '0' + digit;
    };

    $scope.GetScore = function () {
        // comment out this if you want live score
        if (!$scope.IsCompleted())
            return 'No score yet';

        var remaining = $scope.GetPendingCount();
        var skipped = $scope.GetSkippedCount();
        var successful = $scope.GetCompletedCount();

        var score = GameService.getScore(successful, skipped, remaining, $scope.seconds);
        return score;
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
        .when('/rules', {
            templateUrl: 'rules.html',
            controller: 'RulesCtrl'
        })
        .otherwise({ redirectTo: '/rules' });
}]);