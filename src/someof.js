var schemaFormSomeOf;
angular.module('schemaForm').config(['schemaFormDecoratorsProvider', 'schemaFormProvider', 'sfBuilderProvider', 'sfPathProvider', function (
  decoratorsProvider, sfProvider, sfBuilderProvider, sfPathProvider) {

  var ofNodeTypes = {
    oneOf: 'oneof',
    anyOf: 'anyof',
    allOf: 'allof'
  };

  function someOfFieldset(name, schema, options) {
    var f = sfProvider.defaultFormDefinition(name, _.extend({}, schema, { type: 'object' }), options);
    f.type = 'someof-fieldset';
    f.key = options.path.slice();
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

    var selector = sfProvider.defaultFormDefinition(node, _.extend(_.pick(schema, node, 'title', 'name'), { type: node }), options);
    if (!selector) {
      return null;
    }
    fieldset.selector = selector;
    fieldset.items.push(selector);

    angular.forEach(schema[node], function (item) {
      var optionForm = sfProvider.defaultFormDefinition(item.title || item.name, angular.extend(item, { type: 'object' }), options);
      if (optionForm) {
        optionForm.selector = selector;
        optionForm.condition = 'form.selector.current === \'' + (item.title || item.name) + '\'';
        fieldset.items.push(optionForm);
        selector.forms.push(optionForm);
      }
    });

    return fieldset;
  }

  var simpleTransclusion  = sfBuilderProvider.builders.simpleTransclusion;
  var ngModelOptions      = sfBuilderProvider.builders.ngModelOptions;
  var ngModel             = sfBuilderProvider.builders.ngModel;
  var sfField             = sfBuilderProvider.builders.sfField;
  var condition           = sfBuilderProvider.builders.condition;
  var array               = sfBuilderProvider.builders.array;


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

}]);