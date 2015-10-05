;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['lodash', 'angular-schema-form', 'angular-schema-form-bootstrap'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('lodash'), require('angular-schema-form'), require('angular-schema-form-bootstrap'));
  } else {
    root.schemaFormSomeOf = factory(root._, root.angularSchemaForm, root.schemaFormBootstrap);
  }
}(this, function(_, angularSchemaForm, schemaFormBootStrap) {
angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("decorators/bootstrap/someof-selector.html","<div ng-class=\"{\'has-error\': form.disableErrorState !== true &amp;&amp; hasError(), \'has-success\': form.disableSuccessState !== true &amp;&amp; hasSuccess(), \'has-feedback\': form.feedback !== false}\" class=\"form-group {{form.htmlClass}} schema-form-select\"><label ng-show=\"showTitle()\" class=\"control-label {{form.labelHtmlClass}}\">{{form.title}}</label><select name=\"{{form.key.slice(-1)[0]}}\" ng-model=\"form.selector.current\" ng-disabled=\"form.readonly\" sf-some-of-selector=\"sf-some-of-selector\" ng-options=\"item.value as item.name group by item.group for item in form.titleMap\" class=\"form-control {{form.fieldHtmlClass}}\"></select><div sf-message=\"form.description\" class=\"help-block\"></div></div>");
$templateCache.put("decorators/bootstrap/someof.html","<fieldset ng-disabled=\"form.readonly\" sf-some-of=\"$$value$$\" sf-field-model=\"sf-some-of\" class=\"schema-form-fieldset {{form.htmlClass}} schema-form-someof\"><legend ng-class=\"{\'sr-only\': !showTitle() }\">{{ form.title }}</legend><div ng-show=\"form.description\" ng-bind-html=\"form.description\" class=\"help-block\"></div></fieldset>");}]);
var schemaFormSomeOf;
angular.module('schemaForm').config(['schemaFormDecoratorsProvider', 'schemaFormProvider', 'sfBuilderProvider', 'sfPathProvider', 'someOfProvider', function (
  decoratorsProvider, sfProvider, sfBuilderProvider, sfPathProvider, someOfProvider) {

  var ofNodeTypes = {
    oneOf: 'oneof',
    anyOf: 'anyof',
    allOf: 'allof'
  };

  function someOfFieldset(name, schema, options) {
    var f = sfProvider.defaultFormDefinition(name, _.extend({}, schema, { type: 'object' }), options);
    f.type = 'someof-fieldset';
    f.key = options.path.slice();
    f.carryover = {};
    return f;
  }

  function someOfSelector(name, schema, options) {
    if (!schema[schema.type] || !ofNodeTypes[schema.type]) {
      return null;
    }

    var selectorPath = options.path.slice();
    selectorPath.push('selected');

    var f = sfProvider.stdFormObj(name, schema, options);
    f.key = selectorPath;
    f.type = ofNodeTypes[schema.type] + '-selector';
    f.titleMap = _.chain(schema[schema.type])
      .map(function (item) {
        return [item.title || item.name, item.title || item.name];
      })
      .object()
      .value();
    f.selector = f;
    f.forms = [];

    options.lookup[sfPathProvider.stringify(selectorPath)] = f;

    return f;
  }

  function someOf(name, schema, options) {
    var node = _.first(_.intersection(_.keys(ofNodeTypes), _.keys(schema)));
    if (!node) {
      return null;
    }

    var fieldset = sfProvider.defaultFormDefinition(name, _.extend(_.omit(schema, node), { type: 'someOfFieldset' }), options);
    if (!fieldset) {
      return null;
    }

    var differentiator = someOfProvider.someOfDifferentiatorProperty();
    var useDifferentiator = differentiator && schema[differentiator];
    if (!useDifferentiator) {
      var selector = sfProvider.defaultFormDefinition(node, _.extend(_.pick(schema, node, 'title', 'name'), {type: node}), options);
      if (!selector) {
        return null;
      }
      fieldset.selector = selector;
      fieldset.items.push(selector);
    }

    angular.forEach(schema[node], function (item) {
      var optionForm = sfProvider.defaultFormDefinition(
        item.title || item.name,
        angular.extend(item, {type: 'object'}),
        options
      );

      if (optionForm) {
        optionForm.selector = selector;
        if (useDifferentiator) {
          var diffKey = fieldset.key.slice();
          diffKey.push(differentiator);
          optionForm.condition = 'model' + buildModelPath(diffKey) + ' === \'' + item.properties[differentiator].enum[0] + '\'';
          if (optionForm.items) {
            optionForm.items = _.filter(optionForm.items, function (item) {
              return !_.has(schema.properties, item.title);
            });
            _.each(optionForm.items, function (item) {
              item.destroyStrategy = 'carry';
              item.carryover = fieldset.carryover;
            });
          }
        } else {
          optionForm.condition = 'form.selector.current === \'' + (item.title || item.name) + '\'';
          selector.forms.push(optionForm);
        }
        fieldset.items.push(optionForm);
      }
    });

    return fieldset;
  }

  function buildModelPath(key) {
    return _.map(key, function (segment) {
      if (segment !== '') {
        return '[\'' + segment + '\']';
      }
      return '[arrayIndex]'
    }).join('');
  }

  var simpleTransclusion  = sfBuilderProvider.builders.simpleTransclusion;
  var ngModelOptions      = sfBuilderProvider.builders.ngModelOptions;
  var ngModel             = sfBuilderProvider.builders.ngModel;
  var sfField             = sfBuilderProvider.builders.sfField;
  var condition           = sfBuilderProvider.builders.condition;
  var array               = sfBuilderProvider.builders.array;

  function carryoverBuilder(args) {
    if (args.form.destroyStrategy === 'carry') {
      args.fieldFrag.firstChild.setAttribute('sf-carryover', '');
    }
  }

  sfProvider.prependRule('object', someOf);
  sfProvider.prependRule('someOfFieldset', someOfFieldset);
  decoratorsProvider.defineAddOn('bootstrapDecorator', 'someof-fieldset', 'decorators/bootstrap/someof.html', [
    sfField, ngModel, ngModelOptions, simpleTransclusion
  ]);

  _.each(ofNodeTypes, function (type, node) {
    sfProvider.prependRule(node, someOfSelector);
    decoratorsProvider.defineAddOn('bootstrapDecorator', type + '-selector', 'decorators/bootstrap/someof-selector.html', [
      sfField, ngModel, ngModelOptions, condition
    ]);
  });

  var decorator = decoratorsProvider.decorator();
  _.each(decorator, function (type) {
    if (type.builder) {
      type.builder.push(carryoverBuilder);
    }
  });



}]);

angular.module('schemaForm').provider('someOf', function () {

  var someOfDifferentiatorPropertyName;

  this.someOfDifferentiatorProperty = function someOfDifferentiatorProperty(propertyName) {
    if (typeof(propertyName) !== 'undefined') {
      someOfDifferentiatorPropertyName = propertyName;
    }
    return someOfDifferentiatorPropertyName
  };

  this.$get = [function () {
    return {};
  }];

});
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
angular.module('schemaForm').directive('sfSomeOf',
function () {
    return {
        scope: true,
        controller: ['$attrs', '$parse', '$scope', function sfSomeOfCtrl($attrs, $parse, $scope) {
            var modelExpr = $parse($attrs.sfSomeOf);

            return {
                getModel: function getModel() {
                    return modelExpr($scope);
                },
                getKey: function getKey() {
                    return $scope.form.key;
                }
            };
        }]
    };
});
angular.module('schemaForm').directive('sfSomeOfSelector',
['sfValidator', function (sfValidator) {
    return {
        require: ['^sf-some-of', 'ngModel'],
        scope: false,
        link: function postLink(scope, element, attrs, ctrls) {
            var sfSomeOfCtrl = ctrls[0];
            var ngModelCtrl = ctrls[1];

            var model = sfSomeOfCtrl.getModel();
            var match = _.find(scope.form.forms, function (form) {
                var formToValidate = _.extend({ key: sfSomeOfCtrl.getKey() }, form);
                return sfValidator.validate(formToValidate, model).valid;
            });

            if (match) {
                ngModelCtrl.$setViewValue(match.title || match.name);
                ngModelCtrl.$setPristine();
                ngModelCtrl.$setUntouched();
            }
        }
    };
}]);
return schemaFormSomeOf;
}));
