angular
  .module('mean-starter')
  .controller('SignupController', SignupController);

function SignupController() {
  var vm = this;
  vm.submitAttempted = false;
  vm.usernameExists = false;
  // vm.submit = function(isValid) {
  //   if (isValid) {
  //     Auth
  //       .signup(vm.user)
  //       .error(function(data, status, headers, config) {
  //         if (data === 'Username already exists.') {
  //           vm.usernameExists = true;
  //         }
  //         else {
  //           console.log('Problem signing up.');
  //         }
  //       });
  //
  //   }
  //   else {
  //     vm.submitAttempted = true;
  //   }
  // };
  // vm.closeAlert = function() {
  //   vm.usernameExists = false;
  // };
}
