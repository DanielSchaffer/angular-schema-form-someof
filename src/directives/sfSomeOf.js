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