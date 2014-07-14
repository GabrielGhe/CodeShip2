//http://cdnjs.com/libraries/codemirror
var MyApp = angular.module('MyApp', ['ngRoute', 'ngAnimate', 'ui.bootstrap', 'ui.codemirror', 'luegg.directives']);

//Routing Configuration 
MyApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
	$routeProvider
		.when('/:id', { templateUrl : "partials/partialInstance.html", controller : "InstanceCTRL"})
		.otherwise({ redirectTo : '/'});

	$locationProvider.html5Mode(true);
}]);


//Faye factory
MyApp.factory('Faye', ['$log', '$http', function($log, $http){
	var subscription;
	var client = new Faye.Client('http://localhost:3000/faye', {
		timeout : 60
	});

	return {
		publish: function(channel, message) {
			client.publish(channel, message);
		},

		subscribe: function(channel, callback) {
			subscription = client.subscribe(channel, callback);
			return subscription;
		},

		unsubscribe: function(){
			subscription.cancel();
		},

		getUsers: function(id, cb){
			users = [];
			$http.get("/" + id + "/users").then(function(response) {
				cb(response.data);
			});
		}
	}
}]);

MyApp.filter("notme", function(){
	return function(input, scope){
		var newArray = [];
		for(var i=0; i != input.length; ++i){
			if(input[i].color !== scope.color){
				newArray.push(input[i]);
			}
		}
		return newArray;
	}
});

MyApp.directive('usercursor', function(){
	return {
        restrict:'E',
        link:function (scope, element, attrs) {
            element.addClass('userCursor');
            scope.$watch(attrs.x, function (x) {
                element.css('left', x + 'px');
            });
            scope.$watch(attrs.y, function (y) {
                element.css('top', y + 'px');
            });
        }
    };
});

//Codemirror languages
MyApp.constant("Language", {
	javascript: "javascript",
	html: "html",
	go: "go",
	sql: "sql",
	php: "php",
	python: "python",
	ruby: "ruby",
	shell: "shell"
});

/* ###############################################################################
 * ##
 * ##							InstanceCRTL
 * ##
 * ############################################################################### */
MyApp.controller("InstanceCTRL", [
	'$scope','$routeParams', 'Faye', '$sce', 'Language', '$modal', function($scope, $routeParams, Faye, $sce, Language, $modal){

	//Codemirror properties
	$scope.editorOptions = {
        value: "\n",
		lineNumbers: true,
		matchBrackets: true,
		mode:  "javascript",
		theme: "monokai",
		autoCloseBrackets : true
    };

    //Codemirror editor loaded
    $scope.codemirrorLoaded = function(_editor){
    	$scope._editor = _editor;

    	_editor.on("change", function(cm, change) {
			var func = $scope.sendEvents[change.origin];
			if(func) func(change);
		});

		_editor.on("cursorActivity", function(cm){
			var coor = cm.cursorCoords(false);
			coor["color"] = $scope.color;
			var func = $scope.sendEvents["cursorActivity"];
			if(func) func(coor);
		});

        _editor.on("gutterClick", function(cm, n) {
            var info = cm.lineInfo(n);
        });
    };

    $scope.ChangeLanguage = function(lang){
    	var newLang = Language[lang];
    	if(newLang){
    		$scope.editorOptions.mode = newLang;
    	}
    };

	$scope.to_trusted = function(html_code) {
		return $sce.trustAsHtml(html_code);
	};

    $scope.Who = function(){
    	return $scope.users.length;
    };

    $scope.AddUser = function(obj){
 		$scope.$apply(function() {
			$scope.users.push(obj);
		});
 	};

 	$scope.RemoveUser = function(obj, cb){
 		for(var i=0; i != $scope.users.length; ++i){
 			var colorAtI = $scope.users[i].color;
 			if(obj == colorAtI){
 				var whoLeft = $scope.users.splice(i, 1);
				cb(whoLeft[0]);
				break;
 			}
 		}
 	};

 	$scope.AddChatMessage = function(obj){
 		$scope.$apply(function() {
			$scope.comments.push(obj);
		});
 	};

 	$scope.PostSubscribe = function(){
 		var obj = {
 			type: "postsubscribe",
			name: $scope.name,
			color: $scope.color
 		};
 		Faye.publish('/' + $scope.instanceId, JSON.stringify(obj));
 	}

 	$scope.Init = function(){
 		$scope.chatShow = false;
 		$scope.instanceId = $routeParams.id;
 		$scope.color = "";
 		$scope.receiveEvents = new ReceiveEventHandler($scope);
 		$scope.sendEvents = new SendEventHandler($scope, Faye);


 		$scope.name = "";
 		$scope.files = ['untitled.js', 'thingy.css', 'blah.java', 'kay.cpp', 'gogo.py', 'haha.html', 'vushky.swift', 'blah.m'];
 		$scope.comments = [];
 		$scope.users = [];
 	};

 	$scope.open = function () {
		var modalInstance = $modal.open({
			templateUrl: 'modal.html',
			controller: 'ModalCtrl',
			backdrop: 'static'
		});

		modalInstance.result.then(function (username) {
			$scope.name = username;
			$scope.FayeLoading();
		});
    };

 	$scope.FayeLoading = function(){
 		//get users currently in the instance
 		Faye.getUsers($scope.instanceId, function(users){
 			for(var i=0; i != users.length; ++i){
 				$scope.users.push({ color: users[i] });
 			}
 		});

 		// Listen to data coming from the server via Faye
		Faye.subscribe('/' + $scope.instanceId, function(msg) {
			// Handle messages
			var message = JSON.parse(msg);
			var func = $scope.receiveEvents[message.type];
			if(func) func(message);
		});

		//if someone leaves page, tell everyone
		angular.element(window).bind("beforeunload", function(){
			Faye.unsubscribe();
		});
 	};

 	$scope.Init();
 	$scope.open();
}]);

/* ###############################################################################
 * ##
 * ##							ModalCtrl
 * ##
 * ############################################################################### */
MyApp.controller("ModalCtrl", ['$scope', '$modalInstance', function($scope, $modalInstance){
	$scope.ok = function (username) {
        if(username.trim() !== ""){
            $modalInstance.close(username);
        }
	};

    $scope.enter = function(event, username){
        if(event.keyCode === 13){
            $scope.ok(username);
        }
    };
}]);