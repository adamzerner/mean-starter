angular
  .module('mean-starter')
  .run(run)
;

function run(Auth, $cookies, $rootScope) {
  $rootScope.user = {};
  Auth.requestCurrentUser();
}
