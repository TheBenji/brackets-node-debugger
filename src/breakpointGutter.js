/*!
 * Brackets Node Debugger
 *
 * @author Benjamin August
 * @license http://opensource.org/licenses/MIT
 */

define(function (require, exports) {
    "use strict";

	var _ = brackets.getModule("thirdparty/lodash"),
    EditorManager = brackets.getModule("editor/EditorManager"),
        DocumentManager = brackets.getModule("document/DocumentManager");

	var cm = null,
        cd = null,
        breakpoints = [],
        _nodeDebuggerDomain,
		gutterName = 'node-debugger-bp-gutter';

	function _updateCm() {
		var editor = EditorManager.getActiveEditor();

        if (!editor || !editor._codeMirror) {
            return;
        }

		cm = editor._codeMirror;

        //Get the path to the current file as well
        var _cd = DocumentManager.getCurrentDocument();
        if(_cd) {
            cd = _cd.file.fullPath;
        }

	}

	function _updateGutters() {
		if (!cm) { return; }

        var gutters = cm.getOption("gutters").slice(0);
        if (gutters.indexOf(gutterName) === -1) {
            gutters.unshift(gutterName);
            cm.setOption("gutters", gutters);
            cm.on("gutterClick", gutterClick);
        }
	}

	function gutterClick(cm, n, gutterId) {
		if (gutterId !== gutterName && gutterId !== "CodeMirror-linenumbers") {
            return;
        }

		var info = cm.lineInfo(n);

		if(info.gutterMarkers && info.gutterMarkers[gutterName]) {
            var bp = _.find(breakpoints, function(obj) {
                return obj.line === n && cm === obj.cm;
            });
            _nodeDebuggerDomain.exec("removeBreakpoint", bp.breakpoint);
            cm.setGutterMarker( bp.line, gutterName, null );
            var i = breakpoints.indexOf(bp);
            breakpoints.splice(i, 1);
		} else {
            _nodeDebuggerDomain.exec("setBreakpoint", cd, n);
		}
	}

	function init(nodeDebuggerDomain) {
        _nodeDebuggerDomain = nodeDebuggerDomain;
		_updateCm();
		_updateGutters();
	}

    function addBreakpoint(bp) {
        bp.cm = cm;
        breakpoints.push(bp);

        var $marker = $("<div>")
                .addClass('breakpoint-gutter')
                .html("●");

        bp.cm.setGutterMarker( bp.line, gutterName, $marker[0] );
    }

    function removeAllBreakpoints() {
        breakpoints.forEach(function(bp) {
            bp.cm.setGutterMarker( bp.line, gutterName, null);
        });
        //Delete all
        breakpoints = [];
    }

    $(DocumentManager).on("currentDocumentChange", function (evt, currentDocument, previousDocument) {
        _updateCm();
        _updateGutters();
    });

	exports.init = init;
    exports.addBreakpoint = addBreakpoint;
    exports.removeAllBreakpoints = removeAllBreakpoints;
});