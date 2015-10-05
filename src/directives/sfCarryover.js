angular.module('schemaForm').directive('sfCarryover',
['sfSelect', function sfCarryover(sfSelect) {
  return {
    scope: false,
    priority: 100,
    link: {
      pre: function sfCarryoverPreLink(scope, element, attrs) {
        scope.$on('schemaFormPropagateNgModelController', function (event, ngModel, ngModelExpr) {
          if (scope.form.carryover) {
            var carryoverKey = scope.form.key[scope.form.key.length - 1];
            if (carryoverKey && typeof(scope.form.carryover[carryoverKey]) !== 'undefined') {
              var expr = (attrs.sfNewArray || ngModelExpr) + '=carryoverValue';
              scope.$eval(expr, { carryoverValue: scope.form.carryover[carryoverKey] });
            }
          }
        });

        scope.$on('$destroy', function () {
          var form = scope.form;
          if (!scope.externalDestructionInProgress) {
            var destroyStrategy = form.destroyStrategy ||
              (scope.options && scope.options.destroyStrategy) || 'remove';
            // No key no model, and we might have strategy 'retain'
            if (form.key && destroyStrategy === 'carry') {

              // Get the object that has the property we want to clear.
              var obj = scope.model;
              if (form.key.length > 1) {
                var key = _.map(form.key.slice(0, form.key.length - 1), function (segment) {
                  if (segment === '') {
                    return scope.$index;
                  }
                  return segment;
                });
                obj = sfSelect(key, obj);
              }

              // We can get undefined here if the form hasn't been filled out entirely
              if (typeof(obj) === 'undefined') {
                return;
              }

              var propKey = form.key.slice(-1);
              form.carryover[propKey] = obj[propKey];
              delete obj[propKey];
            }
          }
        });
      }
    }
  };
}]);