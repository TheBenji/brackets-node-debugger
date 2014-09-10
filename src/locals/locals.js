/*global define, $, brackets */
define(function (require, exports) {
	"use strict";

	var nodeDebuggerPanel = require('./../debuggerPanel').debuggerPanel;

	var locals = {},
		$locals = $(null),
		_allLocals = ['this'],
		_nodeDebuggerDomain;

	var displayLocals = function() {

		$locals.find('.locals-wrapper').remove();
		var $wrapper = $('<div>').addClass('locals-wrapper');
		_allLocals.forEach(function(l) {
			$('<div>').text(l + ': ' + locals[l]).appendTo($wrapper);
		});

		//append
		$wrapper.appendTo($locals);
	};

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
					//and get the value
					locals[a.name] = body.lookup[a.value.ref].text ? body.lookup[a.value.ref].text : 'undefined';
				});
			}
			//Get all locals
			if(body.locals && body.locals.length > 0) {
				body.locals.forEach(function(l) {
					_allLocals.push(l.name);
					locals[l.name] = body.lookup[l.value.ref] ? body.lookup[l.value.ref].text : 'undefined';
				});
			}

			//And display the stuff in the panel
			displayLocals();
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

		//Add a tab into the sidebox
		$locals = $('<div>').addClass('locals');
		$locals.prependTo($('#brackets-node-debugger-sidebar'));
	};

	exports.locals = locals;
});
