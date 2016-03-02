var queryBuilder = angular.module('queryBuilder', []);

queryBuilder.run(['$templateCache', function($templateCache) {
	$templateCache.put('/queryBuilderDirective.html',
		'<div ng-class="classes.panels.wrapper">' +
			'<div ng-if="!!title" ng-class="classes.panels.heading">{{title}}</div>' +
			'<div ng-class="classes.panels.body">' +
        '<div class="form-inline">' +
            '<select ng-if="operators.length > 1" ng-options="o.name for o in operators" ng-model="group.operator" class="form-control"></select>' +
            '<button ng-click="addCondition()" ng-class="classes.addButton"><span ng-class="classes.addIcon"></span> Add Condition</button>' +
            '<button ng-if="nesting" ng-click="addGroup()" ng-class="classes.addButton"><span ng-class="classes.addIcon"></span> Add Group</button>' +
            '<button ng-if="nesting" ng-if="$parent.group" ng-click="removeGroup()" ng-class="classes.removeButton"><span ng-class="classes.removeIcon"></span> Remove Group</button>' +
        '</div>' +
        '<div class="group-conditions">' +
            '<div ng-repeat="rule in group.rules | orderBy:\'index\'" class="condition">' +
                '<div ng-switch="rule.hasOwnProperty(\'group\')">' +
                    '<div ng-switch-when="true">' +
                        '<query-builder fields="fields" comparators="comparators" operators="operators" group="rule.group"></query-builder>' +
                    '</div>' +
                    '<div ng-switch-default="ng-switch-default">' +
											'<div class="form-inline">' +
													'<select ng-change="changeField($index)" ng-options="t.name for t in fields" ng-model="rule.field" class="form-control"></select>' +
													'<select ng-options="c.name disable when !!rule.field.disabledComparators && rule.field.disabledComparators.indexOf(c.id) !== -1 for c in comparators" ng-model="rule.comparator" class="form-control"></select>' +
													'<input ng-if="!rule.field.options || rule.field.options.length === 0"type="text" ng-model="rule.data" class="form-control"/>' +
													'<select ng-if="rule.field.options.length > 0 && rule.comparator.value !== \'->\'" ng-model="rule.data" ng-options="o.name for o in rule.field.options" class="form-control"></select>' +
													'<select ng-if="rule.field.options.length > 0 && rule.comparator.value === \'->\'" multiple="true" ng-model="rule.data" ng-options="o.name for o in rule.field.options" class="form-control"></select>' +
													'<button ng-click="removeCondition($index)" ng-class="classes.removeButton"><span ng-class="classes.removeIcon"></span></button>' +
											'</div>' +
									 '</div>' +
								'</div>' +
								'<div ng-if="separateLinesWithOperator && !$last">' +
									'{{group.operator.name}}' +
								'</div>' +
						'</div>' +
				'</div>' +
			'</div>' +
		'</div>');
}]);

queryBuilder.factory('queryService', [function() {
	String.prototype.splice = function(index, count, add) { return this.slice(0, index) + (add || "") + this.slice(index + count); }

	return {
		asString: asString,
		asReadable: asReadable,
		parseFromString: parseFromString,
	}

	function asString(group) {
		if (!group) return "";
		for (var str = "(", i = 0; i < group.rules.length; i++) {
			i > 0 && (str += group.operator.value);
			var dataString = '';
			if (!!group.rules[i].field && !!group.rules[i].field.options &&
				group.rules[i].field.options.length > 0) {
				if (group.rules[i].comparator.value !== '->') {
					dataString = group.rules[i].data.value;
				} else {
					var isFirst = true;
					if (!!group.rules[i].data) {
						group.rules[i].data.forEach(function(data) {
							if (!isFirst) {
								dataString += ',' + data.value;
							} else {
								isFirst = false;
								dataString += data.value;
							}
						});
					}
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

	function asReadable(group) {
		if (!group) return "";
		for (var str = "", i = 0; i < group.rules.length; i++) {
			i > 0 && (str += ' ' + group.operator.name + ' ');
			var dataString = '';
			if (!!group.rules[i].field && !!group.rules[i].field.options &&
				group.rules[i].field.options.length > 0) {
				if (group.rules[i].comparator.value !== '->') {
					dataString = group.rules[i].data.name;
				} else {
					var isFirst = true;
					if (!!group.rules[i].data) {
						group.rules[i].data.forEach(function(data) {
							if (!isFirst) {
								dataString += ',' + data.name;
							} else {
								isFirst = false;
								dataString += data.name;
							}
						});
					}
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
				if (rule.comparator.value !== '->') {
					rule.field.options.forEach(function(option) {
						var optionIdAsString = String(option.value);
						if (dataString.indexOf(optionIdAsString) !== -1 && optionIdAsString.length === dataString.length) {
							rule.data = option;
						}
					});
				} else {
					rule.data = [];
					var optionIds = dataString.split(',');
					rule.field.options.forEach(function(option) {
						var optionIdAsString = String(option.value);
						if (optionIds.indexOf(optionIdAsString) !== -1) {
							rule.data.push(option);
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
		templateUrl: '/queryBuilderDirective.html',
		compile: function(element, attrs) {
			var content, directive;
			content = element.contents().remove();
			return function(scope, element, attrs) {
				scope.classes = {};
				scope.nesting = true;
				scope.separateLinesWithComparator = false;

				scope.addCondition = function() {
					scope.group.rules.push({
						comparator: scope.comparators[0],
						field: scope.fields[0],
						data: ''
					});
				};

				scope.removeCondition = function(index) {
					scope.group.rules.splice(index, 1);
				};

				scope.addGroup = function() {
					scope.group.rules.push({
						group: {
							operator: scope.operators[0],
							rules: []
						}
					});
				};

				scope.removeGroup = function() {
					"group" in scope.$parent && scope.$parent.group.rules.splice(scope.$parent.$index, 1);
				};

				scope.changeField = function(ruleId) {
					if (!!scope.group.rules[ruleId].field.disabledComparators) {
						if (scope.group.rules[ruleId].field.disabledComparators.indexOf(scope.group.rules[ruleId].comparator.id) !== -1) {
							scope.comparators.some(function(comparator) {
								if (scope.group.rules[ruleId].field.disabledComparators.indexOf(comparator.id)) {
									scope.group.rules[ruleId].comparator = comparator;
									return true;
								}
							});
						}
					}
				};

				directive || (directive = $compile(content));

				element.append(directive(scope, function($compile) {
					return $compile;
				}));

				//2 watches: 1 for input as object, one for input as string when one of them is resolved remove the watches
				var stringWatcher = scope.$watch('asString', function(newValue) {
					if (!!newValue && newValue.length > 0) {
						stringWatcher();
						objectWatcher();
						newValue = String(newValue);
						scope.group = queryService.parseFromString(newValue, scope.fields, scope.operators, scope.comparators);
					}
				});

				var objectWatcher = scope.$watch('group', function(newValue) {
					if (!!newValue) {
						stringWatcher();
						objectWatcher();
					}
				});

				var settingsWatcher = scope.$watch(function() { return scope.settings; },
					function() {
						if (scope.settings && Object.keys(scope.settings).indexOf('nesting') !== -1) {
							scope.nesting = scope.settings.nesting;
						}

						if (scope.settings && Object.keys(scope.settings).indexOf('addIconClass') !== -1) {
							scope.classes.addIcon = scope.settings.addIconClass;
						}
						if (scope.settings && Object.keys(scope.settings).indexOf('removeIconClass') !== -1) {
							scope.classes.removeIcon = scope.settings.removeIconClass;
						}

						if (scope.settings && Object.keys(scope.settings).indexOf('addButtonClass') !== -1) {
							scope.classes.addButton = scope.settings.addButtonClass;
						}
						if (scope.settings && Object.keys(scope.settings).indexOf('removeButtonClass') !== -1) {
							scope.classes.removeButton = scope.settings.removeButtonClass;
						}

						if (scope.settings && Object.keys(scope.settings).indexOf('separateLinesWithOperator') !== -1) {
							scope.separateLinesWithOperator = scope.settings.separateLinesWithOperator;
						}

						if (scope.settings && Object.keys(scope.settings).indexOf('bootstrapPanelsEnabled') !== -1) {
							if (scope.settings.panelsEnabled) {
								scope.classes.panels = {
									wrapper: 'panel panel-default',
									body: 'panel-body',
									heading: 'panel-heading'
								}
							}
						} else {
							scope.classes.panels = {
								wrapper: 'panel panel-default',
								body: 'panel-body',
								heading: 'panel-heading'
							}
						}
					});
			}
		}
	}
}]);
