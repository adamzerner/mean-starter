angular
  .module('mean-starter')
  .run(run)
;

function run(Auth, $rootScope) {
  $rootScope.user = {};
  Auth.requestCurrentUser();
}
