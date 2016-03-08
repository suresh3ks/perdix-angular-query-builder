var queryBuilder = angular.module('queryBuilder', ['angularjs-dropdown-multiselect']);
String.prototype.splice = function(index, count, add) { return this.slice(0, index) + (add || "") + this.slice(index + count); }

queryBuilder.run(['$templateCache', function($templateCache) {
	$templateCache.put('/queryBuilderDirective.html',
		'<div ng-class="classes.panels.wrapper">' +
			'<div ng-if="!!title" ng-class="classes.panels.heading">{{title}}</div>' +
			'<div ng-class="classes.panels.body">' +
        '<div class="form-inline">' +
            '<select ng-if="queryBuilder.operators.length > 1" ng-options="o.name for o in queryBuilder.operators" ng-model="queryBuilder.group.operator" class="form-control"></select>' +
            '<button ng-click="queryBuilder.addCondition()" ng-class="queryBuilder.classes.addButton"><span ng-class="queryBuilder.classes.addIcon"></span> Add Condition</button>' +
            '<button ng-if="queryBuilder.nesting" ng-click="queryBuilder.addGroup()" ng-class="queryBuilder.classes.addButton"><span ng-class="queryBuilder.classes.addIcon"></span> Add Group</button>' +
            '<button ng-if="queryBuilder.nesting && !!$parent.queryBuilder.group" ng-click="queryBuilder.removeGroup()" ng-class="classes.removeButton"><span ng-class="classes.removeIcon"></span> Remove Group</button>' +
        '</div>' +
        '<div class="group-conditions">' +
            '<div ng-repeat="rule in queryBuilder.group.rules | orderBy:\'index\'" class="condition">' +
                '<div ng-switch="rule.hasOwnProperty(\'group\')">' +
                    '<div ng-switch-when="true">' +
                        '<query-builder fields="queryBuilder.fields" comparators="queryBuilder.comparators" operators="queryBuilder.operators" group="rule.group"></query-builder>' +
                    '</div>' +
                    '<div ng-switch-default="ng-switch-default">' +
											'<div class="form-inline">' +
													'<select ng-change="queryBuilder.changeField($index)" ng-options="t.name for t in queryBuilder.fields" ng-model="rule.field" class="form-control"></select>' +
													'<select ng-change="queryBuilder.changeComparator($index)" ng-options="c.name disable when !!rule.field.disabledComparators && rule.field.disabledComparators.indexOf(c.id) !== -1 for c in queryBuilder.comparators" ng-model="rule.comparator" class="form-control"></select>' +
													'<input ng-if="!rule.field.options || rule.field.options.length === 0"type="text" ng-model="rule.data" class="form-control"/>' +
													'<div ng-if="!!rule.comparator.dataTemplate" static-include="{{rule.comparator.dataTemplate}}"></div>' +
													'<select ng-if="!rule.comparator.dataTemplate && rule.field.options.length > 0 && rule.comparator.value !== \'->\'" ng-model="rule.data" ng-options="o.name for o in rule.field.options track by o.id" class="form-control"></select>' +
													'<select ng-if="!rule.comparator.dataTemplate && rule.field.options.length > 0 && rule.comparator.value === \'->\'" multiple="true" ng-model="rule.data" ng-options="o.name for o in rule.field.options  track by o.id" class="form-control"></select>' +
													'<button ng-click="queryBuilder.removeCondition($index)" ng-class="queryBuilder.classes.removeButton"><span ng-class="queryBuilder.classes.removeIcon"></span></button>' +
											'</div>' +
									 '</div>' +
								'</div>' +
								'<div ng-if="queryBuilder.separateLinesWithOperator && !$last">' +
									'{{queryBuilder.group.operator.name}}' +
								'</div>' +
						'</div>' +
				'</div>' +
			'</div>' +
		'</div>');
}]);

queryBuilder.factory('queryService', [function() {

	return {
		asString: asString,
		asReadable: asReadable,
		parseFromString: parseFromString,
	}

	function getDataValue(data, options) {
		var value;
		if (data.id) {
			options.some(function(option) {
				if (option.id === data.id) {
					value = option.value || option.id;
					return true;
				}
			})
		} else {
			value = data.value;
		}
		return value;
	}

	function asString(group) {
		if (!group) return "";
		for (var str = "(", i = 0; i < group.rules.length; i++) {
			i > 0 && (str += group.operator.value);
			var dataString = '';
			if (!!group.rules[i].field && !!group.rules[i].field.options &&
				group.rules[i].field.options.length > 0) {
				var isFirst = true;
				if (!!group.rules[i].data && Array.isArray(group.rules[i].data)) {
					group.rules[i].data.forEach(function(data) {
						if (!isFirst) {
							dataString += ',' + getDataValue(data, group.rules[i].field.options);
						} else {
							isFirst = false;
							dataString += getDataValue(data, group.rules[i].field.options);
						}
					});
				} else {
					dataString = getDataValue(group.rules[i].data, group.rules[i].field.options);
				}
			} else {
				dataString = group.rules[i].data;
			}
			str += group.rules[i].group ?
					asString(group.rules[i].group) :
					group.rules[i].field.id + group.rules[i].comparator.value + "\"" + dataString + '"';
		}

		return str + ")";
	}

	function getDataName(data, options) {
		var name;
		if (data.id) {
			options.some(function(option) {
				if (option.id === data.id) {
					name = option.name;
					return true;
				}
			})
		} else {
			name = data.name;
		}
		return name;
	}

	function asReadable(group) {
		if (!group) return "";
		for (var str = "", i = 0; i < group.rules.length; i++) {
			i > 0 && (str += ' ' + group.operator.name + ' ');
			var dataString = '';
			if (!!group.rules[i].field && !!group.rules[i].field.options &&
				group.rules[i].field.options.length > 0) {
				var isFirst = true;
				if (!!group.rules[i].data && Array.isArray(group.rules[i].data)) {
					group.rules[i].data.forEach(function(data) {
						if (!isFirst) {
							dataString += ',' + getDataName(data, group.rules[i].field.options);
						} else {
							isFirst = false;
							dataString += getDataName(data, group.rules[i].field.options);
						}
					});
				} else {
					dataString = group.rules[i].data.name;
				}
			} else {
				dataString = group.rules[i].data;
			}
			str += group.rules[i].group ?
					"(" + asReadable(group.rules[i].group) + ")" :
					group.rules[i].field.name + " " + group.rules[i].comparator.name + " \"" + dataString + '"';
		}

		return str;
	}

	function removeWrappingBraces(spec) {
		if (spec.indexOf('(') !== 0) {
			return spec;
		}
		var areWrapping;
		var openCount = 1;
		var indexOfPreviousOpen = 0;
		var indexOfPreviousClose = 0;
		var indexOfNextOpen = 0;
		var indexOfNextClose = 0;
		while (openCount > 0) {
			indexOfNextOpen = spec.indexOf('(', indexOfPreviousOpen + 1);
			indexOfNextClose = spec.indexOf(')', indexOfPreviousClose + 1);
			if ((indexOfNextOpen === -1 && indexOfNextClose !== -1) ||
							indexOfNextClose < indexOfNextOpen) {
				openCount -= 1;
			} else if ((indexOfNextOpen === -1 && indexOfNextClose === -1) && indexOfNextClose > indexOfNextOpen) {
				openCount += 1;
			}
			indexOfPreviousOpen = indexOfNextOpen;
			indexOfPreviousClose = indexOfNextClose;
		}
		areWrapping = indexOfNextClose === spec.length - 1;
		if (areWrapping) {
			spec = spec.splice(0, 1);
			spec = spec.slice(0, -1);
		}

		return spec;
	}

	function containsOperator(spec, operators) {
		var contains = false;
		operators.forEach(function(operator) {
			if (spec.indexOf(operator.value) !== -1) {
				contains = true;
			}
		});
		return contains;
	}

	function parseFromString(spec, fields, operators, comparators) {
		function getSubGroups(spec, operators) {
			var groups = [];
			var indexOfNextOperator;
			var nextOperator;
			var indexOfNextOpenBrace;
			var openBraceCount;

			// remove first and last charactre ( and )
			spec = removeWrappingBraces(spec);

			while (spec.length > 0) {
				indexOfNextOperator = spec.length;
				operators.forEach(function(operator) {
					var index = spec.indexOf(operator.value);
					if (index !== -1 && index < indexOfNextOperator) {
						indexOfNextOperator = index;
						nextOperator = operator;
					}
				});
				indexOfNextOpenBrace = spec.indexOf('(');
				if ((indexOfNextOpenBrace !== -1 && indexOfNextOpenBrace > indexOfNextOperator) ||
					indexOfNextOpenBrace === -1) {
					if (indexOfNextOperator !== 0) {
						groups.push(spec.substring(0, indexOfNextOperator));
					}
					if (!!nextOperator) {
						spec = spec.splice(0, indexOfNextOperator + nextOperator.value.length);
					} else {
						spec = spec.splice(0, indexOfNextOperator);
					}
				} else {
					openBraceCount = 1;
					indexOfNextOpenBrace = 0;
					indexOfNextCloseBrace = 0;
					while (openBraceCount > 0) {
						previousIndexOfNextCloseBrace = indexOfNextCloseBrace;
						indexOfNextOpenBrace = spec.indexOf('(', indexOfNextOpenBrace + 1)
						indexOfNextCloseBrace = spec.indexOf(')', indexOfNextCloseBrace + 1);
						if ((indexOfNextOpenBrace === -1 && indexOfNextCloseBrace !== -1) ||
							indexOfNextCloseBrace < indexOfNextOpenBrace) {
							openBraceCount -= 1;
						} else if ((indexOfNextOpenBrace === -1 && indexOfNextCloseBrace === -1) && indexOfNextCloseBrace > indexOfNextOpenBrace) {
							openBraceCount += 1;
						} else {
							throw 'something wrong in condition string';
						}
					}
					groups.push(spec.substring(0, indexOfNextCloseBrace + 1));

					spec = spec.splice(0, indexOfNextCloseBrace + 1);
				}
			}

			return { groups: groups, operator: nextOperator };
		}

		function convertToRule(spec, comparators, fields) {
			var rule = {
				field: {},
				comparator: {},
				data: ''
			};
			var indexOfComparator;

			comparators.forEach(function(comparator) {
				if (spec.indexOf(comparator.value) !== -1) {
					rule.comparator = comparator;
					indexOfComparator = spec.indexOf(comparator.value);
					return;
				}
			});

			fields.forEach(function(field) {
				var fieldIdAsString = String(field.id);
				if (spec.indexOf(fieldIdAsString) === 0 && fieldIdAsString.length === indexOfComparator) {
					rule.field = field;
				}
			});

			if (!!rule.field.options && rule.field.options.length > 0) {
				var dataString = spec.substring(String(rule.field.id).length + String(rule.comparator.value).length + 1, spec.length - 1);
				if (dataString.indexOf(',') === -1) {
					rule.field.options.forEach(function(option) {
						var optionIdAsString = String(option.id);
						if (dataString.indexOf(optionIdAsString) !== -1 && optionIdAsString.length === dataString.length) {
							if (Array.isArray(rule.comparator.defaultData)) {
								rule.data = [JSON.parse(JSON.stringify(option))];
							} else {
								rule.data = JSON.parse(JSON.stringify(option));
							}
						}
					});
				} else {
					rule.data = [];
					var optionIds = dataString.split(',');
					rule.field.options.forEach(function(option) {
						var optionIdAsString = String(option.id);
						if (optionIds.indexOf(optionIdAsString) !== -1) {
							rule.data.push(JSON.parse(JSON.stringify(option)));
						}
					});
				}
			} else {
				rule.data = spec.substring(String(rule.field.id).length + String(rule.comparator.value).length + 1, spec.length - 1);
			}

			return rule;
		};

		var group = {
			operator: {},
			rules: []
		}

		var subgroups = getSubGroups(spec, operators);
		if (!!subgroups.operator) {
			group.operator = subgroups.operator;
		} else {
			group.operator = operators[0];
		}

		subgroups.groups.forEach(function(subGroup) {
			subGroup = removeWrappingBraces(subGroup);
			if (containsOperator(subGroup, operators)) {
				group.rules.push({ group: parseFromString(subGroup, fields, operators, comparators) });
			} else {
				group.rules.push(convertToRule(subGroup, comparators, fields));
			}
		});

		return group;
	}
}]);

queryBuilder.directive('queryBuilder', ['$compile', 'queryService', function($compile, queryService) {
	return {
		restrict: 'E',
		scope: {
			group: '=',
			fields: '=',
			comparators: '=',
			operators: '=',
			asString: '=',
			settings: '=',
			title: '@title'
		},
		controllerAs: 'queryBuilder',
		bindToController: true,
		controller: ['$scope', 'queryService', function(scope, queryService) {
			var vm = this;
			vm.classes = {};
			vm.nesting = true;
			vm.separateLinesWithComparator = false;

			vm.addCondition = function() {
				vm.group.rules.push({
					comparator: vm.comparators[0],
					field: vm.fields[0],
					data: ''
				});
			};

			vm.removeCondition = function(index) {
				vm.group.rules.splice(index, 1);
			};

			vm.addGroup = function() {
				vm.group.rules.push({
					group: {
						operator: vm.operators[0],
						rules: []
					}
				});
			};

			vm.removeGroup = function() {
				"group" in scope.$parent.queryBuilder && scope.$parent.queryBuilder.group.rules.splice(scope.$parent.$index, 1);
			};

			vm.changeField = function(ruleId) {
				if (!!vm.group.rules[ruleId].field.disabledComparators) {
					if (vm.group.rules[ruleId].field.disabledComparators.indexOf(vm.group.rules[ruleId].comparator.id) !== -1) {
						vm.comparators.some(function(comparator) {
							if (vm.group.rules[ruleId].field.disabledComparators.indexOf(comparator.id) === -1) {
								vm.group.rules[ruleId].comparator = comparator;
								vm.changeComparator(ruleId);
								return true;
							}
						});
					}
				}
			};

			vm.changeComparator = function(ruleId) {
				if (!!vm.group.rules[ruleId].comparator.defaultData) {
					if (typeof vm.group.rules[ruleId].data !== typeof vm.group.rules[ruleId].comparator.defaultData ||
						Array.isArray(vm.group.rules[ruleId].data) !== Array.isArray(vm.group.rules[ruleId].comparator.defaultData)) {
						vm.group.rules[ruleId].data = JSON.parse(JSON.stringify(vm.group.rules[ruleId].comparator.defaultData));
					}
				} else {
					vm.group.rules[ruleId].data = '';
				}
			}

			//2 watches: 1 for input as object, one for input as string when one of them is resolved remove the watches
			var stringWatcher = scope.$watch(function() {return vm.asString}, function(newValue) {
				if (!!newValue && newValue.length > 0) {
					stringWatcher();
					objectWatcher();
					newValue = String(newValue);
					vm.group = queryService.parseFromString(newValue, vm.fields, vm.operators, vm.comparators);
				}
			});

			var objectWatcher = scope.$watch(function() {return vm.group}, function(newValue) {
				if (!!newValue) {
					stringWatcher();
					objectWatcher();
				}
			});

			var settingsWatcher = scope.$watch(function() { return scope.settings; },
				function() {
					if (vm.settings && Object.keys(vm.settings).indexOf('nesting') !== -1) {
						vm.nesting = vm.settings.nesting;
					}

					if (vm.settings && Object.keys(vm.settings).indexOf('addIconClass') !== -1) {
						vm.classes.addIcon = vm.settings.addIconClass;
					}
					if (vm.settings && Object.keys(vm.settings).indexOf('removeIconClass') !== -1) {
						vm.classes.removeIcon = vm.settings.removeIconClass;
					}

					if (vm.settings && Object.keys(vm.settings).indexOf('addButtonClass') !== -1) {
						vm.classes.addButton = vm.settings.addButtonClass;
					}
					if (vm.settings && Object.keys(vm.settings).indexOf('removeButtonClass') !== -1) {
						vm.classes.removeButton = vm.settings.removeButtonClass;
					}

					if (vm.settings && Object.keys(vm.settings).indexOf('separateLinesWithOperator') !== -1) {
						vm.separateLinesWithOperator = vm.settings.separateLinesWithOperator;
					}

					if (vm.settings && Object.keys(vm.settings).indexOf('bootstrapPanelsEnabled') !== -1) {
						if (vm.settings.panelsEnabled) {
							vm.classes.panels = {
								wrapper: 'panel panel-default',
								body: 'panel-body',
								heading: 'panel-heading'
							}
						}
					} else {
						vm.classes.panels = {
							wrapper: 'panel panel-default',
							body: 'panel-body',
							heading: 'panel-heading'
						}
					}
				});
		}],
		templateUrl: '/queryBuilderDirective.html',
		compile: function(element, attrs) {
			var content, directive;
			content = element.contents().remove();
			return function(scope, element, attrs) {
				directive || (directive = $compile(content));

				element.append(directive(scope, function($compile) {
					return $compile;
				}));
			}
		}
	}
}]);

queryBuilder.directive('staticInclude', ['$templateRequest', '$compile', function($templateRequest, $compile) {
	var staticScope;
	return {
		restrict: 'A',
		transclude: false,
		replace: false,
		link: function(scope, element, attrs, ctrl, transclude) {
			var templatePath = attrs.staticInclude;

			scope.$watch(function() {
				return attrs.staticInclude
			}, function(newValue, oldValue) {
				if (oldValue !== newValue) {
					$templateRequest(newValue)
					.then(function(response) {
						staticScope.$destroy();
						element.empty();
						staticScope = scope.$new();
						var contents = element.html(response).contents();
						$compile(contents)(staticScope);
					});
				}
			});

			$templateRequest(templatePath)
				.then(function(response) {
					var contents = element.html(response).contents();
					staticScope = scope.$new();
					$compile(contents)(staticScope);
				});
		}
	};
}]);
