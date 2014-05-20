'use strict';

angular.module('angular-client-side-auth', ['ngCookies', 'ui.router'])
  .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
  
  var access = routingConfig.accessLevels;
  
  $stateProvider
    .state('public', {
      abstract: true,
      template: "<ui-view/>",
      data: {
        access: access.public
      }
    })
    .state('user', {
      abstract: true,
      template: "<ui-view/>",
      data: {
        access: access.user
      }
    })
    .state('admin', {
      abstract: true,
      template: "<ui-view/>",
      data: {
        access: access.admin
      }
    })
;

  $urlRouterProvider.otherwise('/public');

  // FIX for trailing slashes. Gracefully "borrowed" from https://github.com/angular-ui/ui-router/issues/50
  $urlRouterProvider.rule(function($injector, $location) {
    if($location.protocol() === 'file')
      return;

    var path = $location.path()
    // Note: misnomer. This returns a query object, not a search string
      , search = $location.search()
      , params
    ;

    // check to see if the path already ends in '/'
    if (path[path.length - 1] === '/') {
      return;
    }

    // If there was no search string / query params, return with a `/`
    if (Object.keys(search).length === 0) {
      return path + '/';
    }

    // Otherwise build the search string and return a `/?` prefix
    params = [];
    angular.forEach(search, function(v, k){
      params.push(k + '=' + v);
    });
    return path + '/?' + params.join('&');
  });

  $locationProvider.html5Mode(true);

  $httpProvider.interceptors.push(function($q, $location) {
    return {
      'responseError': function(response) {
        if(response.status === 401 || response.status === 403) {
          $location.path('/login');
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    }
  });
}])

.run(['$rootScope', '$state', 'Auth', function ($rootScope, $state, Auth) {
  $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
    if (!Auth.authorize(toState.data.access)) {
      $rootScope.error = "Seems like you tried accessing a route you don't have access to...";
      event.preventDefault();
        
      if(fromState.url === '^') {
        if(Auth.isLoggedIn())
          $state.go('user');
        else {
          $rootScope.error = null;
          $state.go('public');
        }
      }
    }
  });
}]);