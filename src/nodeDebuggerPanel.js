define(function (require, exports) {
    "use strict";

    var _nodeDebuggerDomain,
        _panel,
        $debuggerContent = $(null),
        $debuggerInput = $(null);


//Adds a new line to the log within brackets
function log($msg) {
    //var h = '<div class="brackets-node-debugger-log">' + msg + '</div>';
    var $h = $("<div>")
        .addClass('brackets-node-debugger-log');

    $h.append($msg)
    $h.insertBefore($debuggerInput);
    $debuggerInput.focus();
    //Scroll to the bottom
    $debuggerContent.scrollTop( 9999999999999 );
}

    function init(nodeDebuggerDomain, panel) {
        _nodeDebuggerDomain = nodeDebuggerDomain;
        _panel = panel;
        $debuggerContent = _panel.find('#brackets-node-debugger-content');
        $debuggerInput = _panel.find('#brackets-node-debugger-input');

		$debuggerInput.on('keypress', function(e) {
            if(e.keyCode == 13) {
                var com = $debuggerInput.html();

                if(com.length > 0) {
                    log( $('<span>').text('>> ' + com) );
                    nodeDebuggerDomain.exec('eval', com);
                    //reset the input field
                    $debuggerInput.html('');
                }
            }
		});
    }

exports.init = init;
exports.log = log;
});