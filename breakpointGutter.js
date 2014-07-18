/*!
 * Brackets Node Debugger
 *
 * @author Benjamin August
 * @license http://opensource.org/licenses/MIT
 */

define(function (require, exports) {
    "use strict";

	var EditorManager = brackets.getModule("editor/EditorManager");
	
	var cm = null,
		gutterName = 'node-debugger-bp-gutter';
	
	function _updateCm() {
		console.log('update CM');
		var editor = EditorManager.getActiveEditor();
		
        if (!editor || !editor._codeMirror) {
            return;
        }
		
		cm = editor._codeMirror;
		
	}
	
	function _updateGutters() {
		console.log('update gutters');
		if (!cm) { return; }

        var gutters = cm.getOption("gutters").slice(0);
        if (gutters.indexOf(gutterName) === -1) {
            gutters.unshift(gutterName);
            cm.setOption("gutters", gutters);
            cm.on("gutterClick", gutterClick);
        }
	}
	
	function gutterClick(cm, n, gutterId) {
		console.log('Gutter clicked!, gutterId: ' + gutterId + 'on line: ' + n);
		if (gutterId !== gutterName && gutterId !== "CodeMirror-linenumbers") {
            return;
        }
		
		var $marker;
		
		var info = cm.lineInfo(n);
		
		if(info.gutterMarkers && info.gutterMarkers[gutterName]) {
			$marker = [null];
		} else {
			$marker = $("<div>")
					.addClass('breakpoint-gutter')
					.html("●");	
		}
		
		cm.setGutterMarker( n, gutterName, $marker[0] );
	}
	
	function init() {
		_updateCm();
		_updateGutters();	
	}
	
	exports.init = init;
});