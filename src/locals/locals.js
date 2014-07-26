/*global define, $, brackets */
define(function (require, exports) {
	"use strict";

	var locals = {},
		_nodeDebuggerDomain;

	/**
	* Register all the nodeDebuggerDomain evens
	*/
	var registerEventListener = function() {

		$(_nodeDebuggerDomain).on('frame', function(e, body) {
			console.log('Got Frame!');
			console.log(body);
		});

		//Get the frame on break
		$(_nodeDebuggerDomain).on('break', function() {
			_nodeDebuggerDomain.exec('getFrame');
		});

	};

	/**
	* Initialise the locals module
	**/
	locals.init = function(nodeDebuggerDomain) {
		_nodeDebuggerDomain = nodeDebuggerDomain;

		registerEventListener();
	};

	exports.locals = locals;
});
