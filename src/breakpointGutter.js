/*!
 * Brackets Node Debugger
 *
 * @author Benjamin August
 * @license http://opensource.org/licenses/MIT
 */

/*global define, brackets, $ */
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

    /*
    * Sets the CodeMirror instance for the active editor
    */
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

    /*
    *   Update gutters, call on document change
    */
	function _updateGutters() {
		if (!cm) { return; }

        var gutters = cm.getOption("gutters").slice(0);
        if (gutters.indexOf(gutterName) === -1) {
            gutters.unshift(gutterName);
            cm.setOption("gutters", gutters);
            cm.on("gutterClick", gutterClick);
        }
	}

    /*
    * Sets or removes Breakpoint at cliked line
    *
    * @param {CodeMirror} cm
    * The CodeMirror instance
    *
    * @param {Number} n
    * LineNumber
    *
    * @param {String} gutterId
    */
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
            //TODO Show warning if not connected
            _nodeDebuggerDomain.exec("setBreakpoint", cd, n);
		}
	}

    /*
    *   @param {NodeDomain} nodeDebuggerDomain
    */
	function init(nodeDebuggerDomain) {
        _nodeDebuggerDomain = nodeDebuggerDomain;
		_updateCm();
		_updateGutters();
	}

    /* Sets the breakpoint gutter
    *
    * @param {breakpoint} bp
    * bp as object like the V8 Debugger sends it
    *
    */
    function addBreakpoint(bp) {
        //If this one of the reconnect BP don't add it
        var exist = _.find(breakpoints, function(obj) {
            return obj.line === bp.line && obj.fullPath === bp.fullPath;
        });
        if(!exist) {
            bp.cm = cm;
            breakpoints.push(bp);

            var $marker = $("<div>")
                    .addClass('breakpoint-gutter')
                    .html("●");

            bp.cm.setGutterMarker( bp.line, gutterName, $marker[0] );
        }
    }

    /*
    * Removes all Breakpoints
    */
    function removeAllBreakpoints() {
        breakpoints.forEach(function(bp) {
            bp.cm.setGutterMarker( bp.line, gutterName, null);
            _nodeDebuggerDomain.exec("removeBreakpoint", bp.breakpoint);
        });
        //Delete all
        breakpoints = [];
    }

    /*
    * Call on connect
    * Set all breakpoints if there are any
    * Remove all gutters and request a list of breakpoints
    * to make sure we're consistent
    */
    function setAllBreakpoints() {
        console.log('Set Breakpoints: ' + breakpoints.length);
        if(breakpoints.length > 0) {
            breakpoints.forEach(function(bp) {
                _nodeDebuggerDomain.exec("setBreakpoint", bp.fullPath, bp.line);
            });
            //TODO: Reload all Breakpoints?
            //Request list of actual set breakpoints
            //_nodeDebuggerDomain.exec("getBreakpoints");
        }
    }

    $(DocumentManager).on("currentDocumentChange", function () {
        _updateCm();
        _updateGutters();
    });


	exports.init = init;
    exports.addBreakpoint = addBreakpoint;
    exports.setAllBreakpoints = setAllBreakpoints;
    exports.removeAllBreakpoints = removeAllBreakpoints;
});