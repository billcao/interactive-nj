(function() {
    'use strict';

    angular.module('njApp', [
        'njApp.controllers',
        'njApp.directives'
    ]);

    // setup dependency injection
    angular.module('d3', []);
    angular.module('njApp.controllers', []);
    angular.module('njApp.directives', ['d3']);
}());
