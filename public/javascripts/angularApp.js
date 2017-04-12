var app = angular.module('votingApp', ['ui.router', 'chart.js']);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: '/home.html',
                controller: 'MainCtrl',
                resolve: {
                    pollPromise: ['polls', function (polls) {
                        return polls.getAll();
                    }]
                }
            })
            .state('polls', {
                url: '/polls/{id}',
                templateUrl: '/polls.html',
                controller: 'PollsCtrl',
                resolve: {
                    poll: ['$stateParams', 'polls', function ($stateParams, polls) {
                        return polls.get($stateParams.id);
                    }]
                }
            });

        $urlRouterProvider.otherwise('home');
    }]);

app.controller('MainCtrl', [
    '$scope',
    'polls',
    function ($scope, polls) {
        $scope.polls = polls.polls;

        $scope.addPoll = function () {
            if (!$scope.title || $scope.title === '') { return; }
            polls.create({
                title: $scope.title
            });
            $scope.title = '';
        };

    }]);

app.controller('PollsCtrl', [
    '$scope',
    'polls',
    'poll',
    function ($scope, polls, poll) {
        $scope.poll = poll;

        //angular-chart.js implementation
        $scope.labels = [];

        $scope.data = [];


        for (var i = 0; i < $scope.poll.options.length; i++) {
            $scope.labels.push($scope.poll.options[i]["label"]);
            $scope.data.push($scope.poll.options[i]["upvotes"]);
        }

        $scope.addOption = function () {
            if ($scope.label === '') { return; }
          /*  for (var i = 0; i < $scope.labels.length; i++) {
                if ($scope.labels[i] === $scope.label) {
                    return;
                }
            }*/
            polls.addOption(poll._id, {
                label: $scope.label,
                author: 'user',
            }).success(function (option) {
                $scope.poll.options.push(option);
                $scope.labels = [];
                $scope.data = [];
                for (var i = 0; i < $scope.poll.options.length; i++) {
                    $scope.labels.push($scope.poll.options[i]["label"]);
                    $scope.data.push($scope.poll.options[i]["upvotes"]);
                }
            });
            $scope.label = '';

        };

        $scope.incrementUpvotes = function (option) {
            polls.upvoteOption(poll, option);
            for (var i = 0; i < $scope.poll.options.length; i++) {
                if ($scope.poll.options[i]["label"] === option["label"]) {
                    $scope.data[i] += 1;
                }
            }
        };


    }]);

app.factory('polls', ['$http', function ($http) {
    var o = {
        polls: []
    };

    o.get = function (id) {
        return $http.get('/polls/' + id).then(function (res) {
            return res.data;
        });
    };

    o.getAll = function () {
        return $http.get('/polls').success(function (data) {
            angular.copy(data, o.polls);
        });
    };

    o.create = function (poll) {
        return $http.post('/polls', poll).success(function (data) {
            o.polls.push(data);
        });
    };

    o.addOption = function (id, option) {
        return $http.post('/polls/' + id + '/options', option);
    };

    o.upvoteOption = function (poll, option) {
        return $http.put('/polls/' + poll._id + '/options/' + option._id + '/upvote')
            .success(function (data) {
                option.upvotes += 1;
            })
            .error(function (error) {
                console.log(error);
            });
    };


    return o;
}]);