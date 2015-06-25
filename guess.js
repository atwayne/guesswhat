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
            TotalSeconds: 8 * 60,
            KeepCategory: false,
            KeepWord: true,
            ExtraSecondPerSuccessGuess: 0,
            ExtraSecondPerSkip: 0,
            FirstAlert: 3 * 60,
        },
        {
            Name: 'Arcade Mode',
            Score: function (successful, skipped, remaining, seconds) {
                var score = successful / 20 * 100;
                return parseInt(score);
            },
            TotalSeconds: 4 * 60,
            KeepCategory: false,
            KeepWord: true,
            ExtraSecondPerSuccessGuess: 0,
            ExtraSecondPerSkip: 0,
            FirstAlert: 2 * 60
        },
        {
            Name: 'Speed Mode',
            Score: function (successful, skipped, remaining, seconds) {
                return successful * 10;
            },
            TotalSeconds: 90,
            KeepCategory: true,
            KeepWord: false,
            ExtraSecondPerSuccessGuess: 15,
            ExtraSecondPerSkip: -30,
            FirstAlert: 40
        }
    ];

    var defaultMode = 'Speed Mode';

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

guessApp.factory('WordService', function ($http) {

    var host = "";

    var wordList = {};

    var prepareWord = function (callback) {
        if (_.isEmpty(wordList)) {
            $http.get(host)
            .then(function (response) {
                var words = _.map(response.data, function (item) { return item.Text; });
                wordList['Default'] = words;
                if (_.isFunction(callback)) {
                    callback();
                }
            });
        }
    };

    var completedCategory = [];

    var getCategories = function () {
        return _.keys(_.omit(wordList, completedCategory));
    };

    var getWords = function (category, keepCategory) {
        if (!keepCategory) {
            markCategoyAsUsed(category);
        }
        return wordList[category];
    };

    var markWordAsUsed = function (word, category) {
        if (category && _.contains(wordList[category], word)) {
            wordList[category] = _.without(wordList[category], word);
        }
        else {
            wordList = _.map(wordList, function (array) {
                return _.without(array, word);
            });
        }
    };

    var markCategoyAsUsed = function (category) {
        completedCategory.push(category);
    };

    return {
        prepareWord: prepareWord,
        getCategories: getCategories,
        getWords: getWords,
        markWordAsUsed: markWordAsUsed
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

    if (_.isEmpty($scope.categories)) {
        WordService.prepareWord(function () {
            $scope.categories = WordService.getCategories();
        });
    }
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

    $scope.rgb = function () {
        var red = 0;
        var green = 0;
        var blue = 0;

        var remaingSeconds = $scope.remainingSeconds();
        if (remaingSeconds >= $scope.currentMode.FirstAlert) {
            // green to yellow
            green = 255;
            if (remaingSeconds > $scope.currentMode.TotalSeconds) {
                red = 0;
            } else {
                var gapFromTotalSeconds = $scope.currentMode.TotalSeconds - remaingSeconds;
                var percent = gapFromTotalSeconds / ($scope.currentMode.TotalSeconds - $scope.currentMode.FirstAlert);
                red = parseInt(percent * 255);
            }
        } else {
            red = 255;
            var percent = remaingSeconds / $scope.currentMode.FirstAlert;
            green = parseInt(percent * 255);
        }

        return "rgb(" + red + "," + green + "," + blue + ")";
    };
    $scope.current = null;

    $scope.pending = WordService.getWords(category, $scope.currentMode.KeepCategory);

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
        // remove it from pending
        $scope.pending = _.without($scope.pending, $scope.current);
        // add it to completed
        $scope.completed.push($scope.current);
        // if success, add extra seconds
        $scope.extraSeconds += $scope.currentMode.ExtraSecondPerSuccessGuess;
        // take it from word list if necessary
        if (!$scope.currentMode.KeepWord) {
            WordService.markWordAsUsed($scope.current, category);
        }
        $scope.GetRandomWord();
    };

    $scope.Skip = function () {
        $scope.pending = _.without($scope.pending, $scope.current);
        $scope.skipped.push($scope.current);
        // if success, add extra seconds
        $scope.extraSeconds += $scope.currentMode.ExtraSecondPerSkip;
        // take it from word list if necessary
        if (!$scope.currentMode.KeepWord) {
            WordService.markWordAsUsed($scope.current, category);
        }
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