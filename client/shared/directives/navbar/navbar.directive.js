angular
  .module('mean-starter')
  .directive('navbar', function() {
    return {
      restrict: 'E',
      templateUrl: '/shared/directives/navbar/navbar.directive.html',
      controller: NavbarController,
      controllerAs: 'vm'
    };
  });

function NavbarController() {
  var vm = this;
  // vm.currentUser = Auth.getCurrentUser();
  // vm.logout = function() {
  //   Auth.logout();
  // };
}