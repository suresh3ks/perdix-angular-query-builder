var app = angular.module('app', ['ngSanitize', 'queryBuilder']);
app.controller('QueryBuilderCtrl', ['$scope', '$templateCache', 'queryService', function($scope, $templateCache, queryService) {
	$templateCache.put('test',
		'<div ng-dropdown-multiselect options="rule.field.options" selected-model="rule.data"></div>'
	);

	$scope.fields = [
		{
			id: 1,
			name: 'IsAwsome',
			options: [
				{ name: 'wow', id: 1, label: 'wow' },
				{ name: 'yes', id: 2, label: 'yes' }
			]
		},
		{ name: 'Lastname', id: 2 },
		{
			name: 'Birthdate', id: 3,
			disabledComparators: [
					1
			]
		},
		{
			name: 'City', id: 4,
			options: [
				{ label: 'paris', name: 'paris', id: 1 },
				{ label: 'london', name: 'london', id: 2 },
				{ label: 'brussels', name: 'brussels', id: 3 }
			]
		},
		{
			name: 'Country', id: 5
		},
		{ name: 'FirstName', id: 6 }
	];

	$scope.example1model = []; $scope.example1data = $scope.fields[0].options;

	$scope.comparators = [
		{ id: 1, name: 'equal to', value: '==' },
		{ id: 2, name: 'not equal to', value: '!=' },
		{ id: 3, name: 'smaller than', value: '<' },
		{ id: 4, name: 'smaller than or equal to', value: '<=' },
		{ id: 5, name: 'greater than', value: '>' },
		{ id: 6, name: 'greater than or equal to', value: '>=' },
		{ id: 7, name: 'in', value: '->', dataTemplate: 'test', defaultData: [] }
	];

	$scope.operators = [
						{ name: 'AND', value: '&&' },
						{ name: 'OR', value: '||' }
	];

	$scope.operators1 = [
		{ name: 'AND', value: '&&' }
	]

	var data = {
		"group":
		{ "operator": $scope.operators[0], "rules": [] }
	};

	$scope.json = null;

	$scope.filter = data;
	$scope.settings1 = {
		nesting: false,
		addIconClass: 'glyphicon glyphicon-plus',
		removeIconClass: 'glyphicon glyphicon-minus',
		addButtonClass: 'btn btn-sm btn-success',
		removeButtonClass: 'btn btn-sm btn-danger',
		separateLinesWithOperator: true,
		bootstrapPanelsEnabled: false
	};

	$scope.$watch('filter', function(newValue) {
		$scope.json = JSON.stringify(newValue, null, 2);
		$scope.outputReadable = queryService.asReadable(newValue.group);
		$scope.outputString = queryService.asString(newValue.group);
	}, true);


	$scope.filter2 = {};
	$scope.json2 = null;

	$scope.$watch('filter2', function(newValue) {
		$scope.json2 = JSON.stringify(newValue, null, 2);
		$scope.output2Readable = queryService.asReadable(newValue.group);
		$scope.output2String = queryService.asString(newValue.group);
	}, true);
	//$scope.queryAsString = '1=="1"&&(2=="3"||5!="Belgium")&&4->"London,Paris"';
	$scope.queryAsString = '(1=="1"&&(2=="Kempenaers"||5!="Belgium")&&4->"1,2")';
	//$scope.queryAsString = '(1=="1")&&(2=="3")';
	//$scope.queryAsString = '((1=="1")&&(2=="3"))'
}]);
