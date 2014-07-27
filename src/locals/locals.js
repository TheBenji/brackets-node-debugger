/*global define, $, brackets */
define(function (require, exports) {
	"use strict";

	var nodeDebuggerPanel = require('./../debuggerPanel').debuggerPanel;

	var locals = {},
		_allLocals = ['this'],
		_nodeDebuggerDomain;

	/**
	* Register all the nodeDebuggerDomain evens
	*/
	var registerEventListener = function() {

		$(_nodeDebuggerDomain).on('frame', function(e, body) {
			console.log(body);
			//Get all arguments
			if(body.arguments && body.arguments.length > 0) {
				body.arguments.forEach(function(a) {
					_allLocals.push(a.name);
				});
			}
			//Get all locals
			if(body.locals && body.locals.length > 0) {
				body.locals.forEach(function(l) {
					_allLocals.push(l.name);
				});
			}
		});

		//Get the frame on break
		$(_nodeDebuggerDomain).on('break', function() {
			_nodeDebuggerDomain.exec('getFrame');
		});

		//Add suggestions
		nodeDebuggerPanel.$debuggerInput.on('keyup', function(e) {
			console.log(_allLocals);
			if(e.keyCode === 39) {
				var $s = nodeDebuggerPanel.$debuggerInput.find('.suggestion');
				var s = $s.text();
				$s.remove();

				var h = nodeDebuggerPanel.$debuggerInput.text();
				nodeDebuggerPanel.$debuggerInput.html(h + s);
				return;
			}
			//Remove old suggestion
			nodeDebuggerPanel.$debuggerInput.find('.suggestion').remove();
			var a = nodeDebuggerPanel.$debuggerInput.html();
			if(a.length > 0) {
				//See if we have something that begins with that
				_allLocals.some(function(l) {
					if(l.indexOf(a) == '0' && l.length > a.length) {
						var $sug = $('<span>').addClass('suggestion').text(l.substr(a.length));
						nodeDebuggerPanel.$debuggerInput.append($sug);
						return true;
					}
				});
			}
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
