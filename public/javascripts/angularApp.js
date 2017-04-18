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
            })
            .state('login', {
                url: '/login',
                templateUrl: '/login.html',
                controller: 'AuthCtrl',
                onEnter: ['$state', 'auth', function ($state, auth) {
                    if (auth.isLoggedIn()) {
                        $state.go('home');
                    }
                }]
            })
            .state('register', {
                url: '/register',
                templateUrl: '/register.html',
                controller: 'AuthCtrl',
                onEnter: ['$state', 'auth', function ($state, auth) {
                    if (auth.isLoggedIn()) {
                        $state.go('home');
                    }
                }]
            });

        $urlRouterProvider.otherwise('home');
    }]);

app.controller('MainCtrl', [
    '$scope',
    'polls',
    'auth',
    function ($scope, polls, auth) {
        $scope.isLoggedIn = auth.isLoggedIn;

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
    'auth',
    '$http',
    function ($scope, polls, poll, auth, $http) {
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.author = auth.currentUser();
        $scope.poll = poll;

        //angular-chart.js implementation
        $scope.labels = [];
        $scope.data = [];

        for (var i = 0; i < $scope.poll.options.length; i++) {
            $scope.labels.push($scope.poll.options[i]["label"]);
            $scope.data.push($scope.poll.options[i]["upvotes"]);
        }

        getmypolls = function () {
            return $http.get('/viewmypolls/' + $scope.author).success(function (data) {
                $scope.mypolls = data;
            });
        }

        // do the ajax call
        getmypolls().then(function (data) {
            // stuff is now in our scope, I can alert it
            console.log($scope.mypolls);

        });

        $scope.delete = function(){
            polls.delete(poll._id);      
        };


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


app.factory('auth', ['$http', '$window', function ($http, $window) {  //$window server interfaces with LocalStorage
    var auth = {};

    auth.saveToken = function (token) {
        $window.localStorage['vote-express'] = token;  //store JWT token in LocalStorage
    };

    auth.getToken = function () {
        return $window.localStorage['vote-express'];
    };


    auth.isLoggedIn = function () {
        var token = auth.getToken();

        if (token) {
            var payload = JSON.parse($window.atob(token.split('.')[1])); /*The payload (between two periods) is a JSON object that has been base64'd.
             We can get it back to a stringified JSON by using $window.atob(), and then back to a javascript object with JSON.parse. */


            return payload.exp > Date.now() / 1000;
        } else {
            return false;
        }
    };

    auth.currentUser = function () {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.username;
        }
    };

    auth.register = function (user) {
        return $http.post('/register', user).success(function (data) {
            auth.saveToken(data.token);
        });
    };

    auth.logIn = function (user) {
        return $http.post('/login', user).success(function (data) {
            auth.saveToken(data.token);
        });
    };

    auth.logOut = function () {
        $window.localStorage.removeItem('vote-express');
    };


    return auth;
}]);


app.controller('AuthCtrl', [
    '$scope',
    '$state',
    'auth',
    function ($scope, $state, auth) {
        $scope.user = {};

        $scope.register = function () {
            auth.register($scope.user).error(function (error) {
                $scope.error = error;
            }).then(function () {
                $state.go('home');
            });
        };

        $scope.logIn = function () {
            auth.logIn($scope.user).error(function (error) {
                $scope.error = error;
            }).then(function () {
                $state.go('home');
            });
        };
    }]);

app.controller('NavCtrl', [
    '$scope',
    'auth',
    function ($scope, auth) {
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logOut;
    }]);


app.factory('polls', ['$http', 'auth', function ($http, auth) {

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
        return $http.post('/polls', poll, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function (data) {
            o.polls.push(data);
        });
    };

    o.addOption = function (id, option) {
        return $http.post('/polls/' + id + '/options', option, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        });
    };

    o.upvoteOption = function (poll, option) {
        return $http.put('/polls/' + poll._id + '/options/' + option._id + '/upvote', null,
            {
                headers: { Authorization: 'Bearer ' + auth.getToken() }
            }
        ).success(function (data) {
            option.upvotes += 1;
        })
            .error(function (error) {
                console.log(error);
            });
    };

    o.delete = function(id){
        return $http.delete('/polls/' + id).success(function (data) {
            console.log('success');
        });
    };

    return o;
}]);