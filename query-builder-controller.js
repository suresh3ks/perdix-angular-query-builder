var app = angular.module('app', ['ngSanitize', 'queryBuilder']);
app.controller('QueryBuilderCtrl', ['$scope', 'queryService', function($scope, queryService) {
	$scope.fields = [
		{
			id: 1,
			name: 'IsAwsome',
			options: [
				{ name: 'wow', id:1, value: 7 },
				{ name: 'yes', id:2, value: 8 }
			]
		},
		{ name: 'Lastname', id: 2 },
		{ name: 'Birthdate', id: 3 },
		{
			name: 'City', id: 4,
			options: [
				{ name: 'paris', id: 1 },
				{ name: 'london', id: 2 },
				{ name: 'brussels', id: 3 }
			]
		},
		{
			name: 'Country', id: 5
		},
		{ name: 'FirstName', id: 6}
	];

	$scope.comparators = [
		{ name: 'equal to', value: '==' },
		{ name: 'not equal to', value: '!=' },
		{ name: 'smaller than', value: '<' },
		{ name: 'smaller than or equal to', value: '<=' },
		{ name: 'greater than', value: '>' },
		{ name: 'greater than or equal to', value: '>=' },
		{ name: 'in', value: '->' }
	];

	$scope.operators = [
						{ name: 'AND', value:'&&' },
						{ name: 'OR', value:'||' }
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
		separateLinesWithOperator: true
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
	$scope.queryAsString = '(1=="7"&&(2=="Kempenaers"||5!="Belgium")&&4->"1,2")';
	//$scope.queryAsString = '(1=="1")&&(2=="3")';
	//$scope.queryAsString = '((1=="1")&&(2=="3"))'
}]);
