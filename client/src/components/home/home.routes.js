angular
  .module('mean-starter')
  .config(config)
;

function config ($stateProvider) {
  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: '/components/home/home.html',
      controller: HomeController
    })
  ;
}

function HomeController() {
}
