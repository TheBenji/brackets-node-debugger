/*global define, $ */
define(function (require, exports) {
	"use strict";

	var _nodeDebuggerDomain,
		_panel,
		_maxDepth = 3,
		history = [],
		historyCurrent = 0,
		$debuggerContent = $(null),
		$debuggerInput = $(null);


	//Adds a new line to the log within brackets
	function log($msg) {
		//var h = '<div class="brackets-node-debugger-log">' + msg + '</div>';
		var $h = $("<div>")
			.addClass('brackets-node-debugger-log');

		$h.append($msg);
		$h.insertBefore($debuggerInput);
		$debuggerInput.focus();
		//Scroll to the bottom
		$debuggerContent.scrollTop( 9999999999999 );
	}

	function init(nodeDebuggerDomain, panel, maxDepth) {
		_maxDepth = maxDepth;
		_nodeDebuggerDomain = nodeDebuggerDomain;
		_panel = panel;
		$debuggerContent = _panel.find('#brackets-node-debugger-content');
		$debuggerInput = _panel.find('#brackets-node-debugger-input');


		$debuggerInput.on('keydown', onKeyDown);

		_panel.find('.clear').on('click', function() {
			$debuggerContent.html($debuggerInput);
			//set the keyHandler again
			$debuggerInput.on('keydown', onKeyDown);
		});
	}

	function onKeyDown(e) {
		//On enter send command
		if(e.keyCode == 13) {
			var com = $debuggerInput.html();

			if(com.length > 0) {
				history.push(com);
				historyCurrent = history.length;
				log( $('<span>').text('>> ' + com) );
				_nodeDebuggerDomain.exec('eval', com);
				//reset the input field
				$debuggerInput.html('');
			}
		}
		//On key up/down scroll through history
		if(e.keyCode == 40) {
			historyCurrent++;
			if(history[historyCurrent]) {
				$debuggerInput.html( history[historyCurrent] );
			} else {
				historyCurrent = history.length;
				$debuggerInput.html('');
			}
			//e.preventDefault();
		}
		if(e.keyCode == 38) {
			historyCurrent--;
			if(history[historyCurrent]) {
				$debuggerInput.html( history[historyCurrent] );
			} else {
				historyCurrent = 0;
			}
			e.preventDefault();
		}
	}

	/*
	*	Creates the HTML from the eval response
	*
	* @params {object} body The object we get from the debugger
	* 
	* @params {number} depth How deep are we going? (Just in case we've got circle stuff)
	*
	* @params {object} Initally the body.lookup propertie
	*
	* @return {jquery object} A jquery HTML object you can inject into the console
	*/
	function createEvalHTML(body, depth, lookup) {
		var $html = $('<span>');
		var $inside = $('<span>');
		depth++;

		if(body.type === 'object' && body.properties) {
			var o = {};
			body.properties.forEach(function(p) {
				if(lookup[p.ref]) {
					o[p.name] = lookup[p.ref].text;
					lookup[p.ref].varName = p.name;
					if(depth < _maxDepth) {
						createEvalHTML(lookup[p.ref], depth, lookup).addClass('var hidden').appendTo($html);
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
	}
	
	/*
	* click event handler to give more Information about an object in the console
	*/
	function evalHTMLonClick(e) {
		var $t = $(e.target);
		if( $t.hasClass('ion-arrow-right-b') ) {
			$t.removeClass('ion-arrow-right-b').addClass('ion-arrow-down-b');
			$t.siblings().removeClass('hidden');
		} else if( $t.hasClass('ion-arrow-down-b') ) {
			$t.removeClass('ion-arrow-down-b').addClass('ion-arrow-right-b');
			$t.siblings().addClass('hidden');
		}
	}
	
exports.init = init;
exports.log = log;
exports.createEvalHTML = createEvalHTML;
});