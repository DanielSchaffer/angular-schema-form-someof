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