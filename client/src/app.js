angular
  .module('mean-starter', ['auth', 'ui.router', 'ui.bootstrap', 'ngCookies', 'ngMessages'])
  .config(config)
  .run(run)
;

function config($locationProvider, $urlRouterProvider) {
  $locationProvider.html5Mode(true);
  $urlRouterProvider.otherwise('/');
}

function run(Auth, $cookies, $rootScope) {
  $rootScope.user = {};
  Auth.requestCurrentUser();
}
