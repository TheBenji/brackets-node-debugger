/*global define, $, brackets */
define(function (require, exports) {
	"use strict";

	var PanelManager = brackets.getModule("view/PanelManager"),
		PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
		prefs = PreferencesManager.getExtensionPrefs("brackets-node-debugger");

	var _nodeDebuggerDomain,
		_maxDepth = 3,
		history = [],
		historyCurrent = 0,
		logContainerHTML = require("text!../assets/debuggerLog.html");


	var debuggerPanel = {
		panel: null,
		$logPanel: $(null),
		$debuggerContent: $(null),
		$debuggerInput: $(null)
	};

	/*
	* KeyHandler for the inputfield
	*/
	function onKeyDown(e) {
		//On enter send command
		if(e.keyCode == 13) {
			//Remove all may existing suggestions
			debuggerPanel.$debuggerInput.find('.suggestion').remove();
			var com = debuggerPanel.$debuggerInput.val();

			if(com.length > 0) {
				history.push(com);
				historyCurrent = history.length;
				debuggerPanel.log( $('<span>').text('>> ' + com) );
				_nodeDebuggerDomain.exec('eval', com);
				//reset the input field
				debuggerPanel.$debuggerInput.val('');
			}
		}
		//On key up/down scroll through history
		if(e.keyCode == 40) {
			historyCurrent++;
			if(history[historyCurrent]) {
				debuggerPanel.$debuggerInput.val( history[historyCurrent] );
			} else {
				historyCurrent = history.length;
				debuggerPanel.$debuggerInput.val('');
			}
			//e.preventDefault();
		}
		if(e.keyCode == 38) {
			historyCurrent--;
			if(history[historyCurrent]) {
				debuggerPanel.$debuggerInput.val( history[historyCurrent] );
			} else {
				historyCurrent = 0;
			}
			e.preventDefault();
		}
	}

	/*
	* click event handler to give more Information about an object in the console
	*/
	function evalHTMLonClick(e) {
		var $t = $(e.target);
		if( $t.hasClass('ion-arrow-right-b') ) {
			$t.removeClass('ion-arrow-right-b').addClass('ion-arrow-down-b');
			$t.siblings().removeClass('hidden');
		} else {
			if( $t.hasClass('ion-arrow-down-b') ) {
				$t.removeClass('ion-arrow-down-b').addClass('ion-arrow-right-b');
				$t.siblings().addClass('hidden');
			}
		}
	}

	/**
	* Initialize the panel
	*
	* @param {NodeDomain} nodeDebuggerDomain
	**/
	debuggerPanel.init = function(nodeDebuggerDomain) {
		//Create the BottomPanel
		debuggerPanel.panel = PanelManager.createBottomPanel("brackets-node-debugger.log", $(logContainerHTML));
		debuggerPanel.$logPanel = debuggerPanel.panel.$panel;

		//Make sure the content size is always ok
		$(PanelManager).on('editorAreaResize', function() {
			var height = debuggerPanel.$logPanel.height();
			debuggerPanel.$debuggerContent.height(height - 50);
		});

		_maxDepth = prefs.get("lookupDepth");
		_nodeDebuggerDomain = nodeDebuggerDomain;

		//Find HTML
		debuggerPanel.$debuggerContent = debuggerPanel.$logPanel.find('#brackets-node-debugger-content');
		debuggerPanel.$debuggerInput = debuggerPanel.$logPanel.find('#brackets-node-debugger-input');

		//Add keydown handler to input
		debuggerPanel.$debuggerInput.on('keyup', onKeyDown);

		//Add help button
		var $help = $('<a>').addClass('ion-help-circled info')
			.attr('href', 'https://github.com/TheBenji/brackets-node-debugger#how-to-use-it')
			.attr('title', 'Help!');

		//Add clear console button
		var $clear = $('<a>').addClass('ion-trash-b clear').attr('href', '#').attr('title', 'Clear console');

		debuggerPanel.addControlElement($clear, false, function() {
			debuggerPanel.$debuggerContent.html($('#brackets-node-debugger-input-wrapper'));
			//set the keyHandler again
			debuggerPanel.$debuggerInput.on('keydown', onKeyDown);
		});
		debuggerPanel.addControlElement($help, false, function(){});

		//Add close button
		var $close = $('<a>').addClass('close').attr('href', '#').html('&times;');
		debuggerPanel.addControlElement($close, true, function() {
			debuggerPanel.toggle();
		});
	};

	/**
	* Toggle the panel
	**/
	debuggerPanel.toggle = function() {
		debuggerPanel.panel.setVisible(!debuggerPanel.panel.isVisible());
		//try to connect on toggle?
		if(prefs.get("autoConnectOnToggle") && debuggerPanel.panel.isVisible()) {
			_nodeDebuggerDomain.exec("start", prefs.get("debugger-port"), prefs.get("debugger-host"), false,  prefs.get("lookupDepth"));
		}
	};

	/**
	*Adds a new line to the log within brackets
	**/
	debuggerPanel.log = function($msg) {
		var $h = $("<div>")
			.addClass('brackets-node-debugger-log');

		$h.append($msg);
		$h.insertBefore($('#brackets-node-debugger-input-wrapper'));
		debuggerPanel.$debuggerInput.focus();
		//Scroll to the bottom
		debuggerPanel.$debuggerContent.scrollTop( 9999999999999 );
	};

	/**
	* Adds a new element to the debugger panel
	*
	* @param {jQuery Element} The jQuery element that will be added to the panel
	* @param {boolean} If true element will be in the top row, false: bottom row
	* @param {function} clickHandler
	**/
	debuggerPanel.addControlElement = function($el, top, clickHandler) {
		var $t = $(null);
		if(top) {
			$t = debuggerPanel.$logPanel.find('.toolbar.top');
		} else {
			$t = debuggerPanel.$logPanel.find('.toolbar.bottom');
		}

		$el.prependTo($t).on('click', clickHandler);
	};

	/**
	* Creates the HTML from the eval response
	* @param {object} body The object we get from the debugger
	* @param {number} depth How deep are we going? (Just in case we've got circle stuff)
	* @param {object} Initally the body.lookup propertie
	* @return {jquery object} A jquery HTML object you can inject into the console
	**/
	debuggerPanel.createEvalHTML = function(body, depth, lookup) {
		var $html = $('<span>');
		var $inside = $('<span>');
		depth++;

		//Exception for Date Object
		if(body.type === 'object' && body.properties && (body.className !== 'Date') ) {
			var o = {};
			body.properties.forEach(function(p) {
				if(lookup[p.ref]) {
					o[p.name] = lookup[p.ref].text;
					lookup[p.ref].varName = p.name;
					if(depth < _maxDepth) {
						debuggerPanel.createEvalHTML(lookup[p.ref], depth, lookup).addClass('var hidden').appendTo($html);
						$inside.addClass('object ion-arrow-right-b');
					}
				}
			});
			$inside.text(JSON.stringify(o)).on('click', evalHTMLonClick);
		} else {
			$inside.text(body.text);
		}

		if(body.varName) {
			$('<span>').addClass('var-name').text(body.varName+': ').prependTo($inside);
		}

		$('<span>').addClass('type').text('['+body.type+'] ').prependTo($inside);
		$inside.prependTo($html);
		return $html;
	};

exports.debuggerPanel = debuggerPanel;
});
