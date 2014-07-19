/*!
 * Brackets Node Debugger
 *
 * @author Benjamin August
 * @license http://opensource.org/licenses/MIT
 */

define(function (require, exports, module) {
    "use strict";

    var CommandManager = brackets.getModule("command/CommandManager"),
		DocumentManager = brackets.getModule("document/DocumentManager"),
		Editor = brackets.getModule("editor/EditorManager"),
        Menus          = brackets.getModule("command/Menus"),
		AppInit        = brackets.getModule("utils/AppInit"),
		PanelManager = brackets.getModule("view/PanelManager"),
        NodeDomain = brackets.getModule("utils/NodeDomain"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
	
    ExtensionUtils.loadStyleSheet(module, "assets/style.css");
    ExtensionUtils.loadStyleSheet(module, "assets/ionicons.css");
	
	var breakpointGutters = require('./breakpointGutter');
	
	var logContainerHTML = require("text!assets/debuggerLog.html");
	
	var $logPanel = $(null),
        $debuggerContent = $(null),
        $debuggerInput = $(null),
        activeLine = null,
        highlightCm = null;
	
	var nodeDebuggerDomain = new NodeDomain("brackets-node-debugger", ExtensionUtils.getModulePath(module, "node/main"));
	
	AppInit.appReady(function() {
		breakpointGutters.init(nodeDebuggerDomain);
		//Adds a new line to the log within brackets
		function addLog(msg) {
			//var h = '<div class="brackets-node-debugger-log">' + msg + '</div>';
            var $h = $("<div>")
                .addClass('brackets-node-debugger-log')
                .text(msg);
			$h.insertBefore($debuggerInput);
            $debuggerInput.focus();
            //Scroll to the bottom
            $debuggerContent.scrollTop( 9999999999999 );
		}


		$(nodeDebuggerDomain).on("connect", function() {
			addLog('Debugger connected');
            $logPanel.find('.activate').addClass('ion-ios7-checkmark')
                                    .removeClass('ion-ios7-close');
            $logPanel.find('a.inactive').addClass('active').removeClass('inactive');
		});

		$(nodeDebuggerDomain).on("close", function() {
            breakpointGutters.removeAllBreakpoints();
			addLog('Debugger disconnected');

            $logPanel.find('.activate').addClass('ion-ios7-close')
                                    .removeClass('ion-ios7-checkmark');
            $logPanel.find('a.active').addClass('inactive').removeClass('active');
		});
		
		$(nodeDebuggerDomain).on("break", function(e, body) {
            //Fixme: Just to support windows, however this most likely won't work in every case
			var docPath = body.script.name.replace(/\\/g, '/');
			
			//console.log(body);

			//addLog("Break on: " + docPath + " : " + body.sourceLine);
			
            //Make sure the panel is open
			panel.setVisible(true);
            $logPanel.find('a.inactive').addClass('active').removeClass('inactive');
			
			DocumentManager.getDocumentForPath(docPath)
				.done(function(doc) {
					DocumentManager.setCurrentDocument( doc );
                    var ae = Editor.getActiveEditor();
                    activeLine = body.sourceLine;
					ae.setCursorPos( activeLine );
                    //Highlight the line
                    highlightCm = ae._codeMirror;
                    activeLine = highlightCm.addLineClass(activeLine, 'node-debugger-highlight-background', 'node-debugger-highlight');

				}).fail(function(err) {
					console.log('[Node Debugger] Failed to open Document: ' + docPath);
				});
			
		});
		
		$(nodeDebuggerDomain).on("eval", function(e, body) {
			console.log(body);
			addLog('<< ' + body.text);
		});

        $(nodeDebuggerDomain).on("setBreakpoint", function(e, bp) {
            breakpointGutters.addBreakpoint(bp);
        });
	
        /* NOTE We just assume for now that this was successfull...
        $(nodeDebuggerDomain).on("clearBreakpoint", function(e, bp) {
            breakpointGutters.clearBreakpoint(bp);
        });
        */
		
		//UI Actions
		$logPanel.find('.close').on('click', function() {
			toggleLog();
		});

		$logPanel.find('.activate').on('click', function() {
			//Starts the socket and connects to the V8 debugger
			nodeDebuggerDomain.exec("start");
		});
		
		$logPanel.find('.next').on('click', function() {
			nodeDebuggerDomain.exec('stepNext');
            debuggerContinue();
		});
		
		$logPanel.find('.in').on('click', function() {
			nodeDebuggerDomain.exec('stepIn');
            debuggerContinue();
		});
		
		$logPanel.find('.out').on('click', function() {
			nodeDebuggerDomain.exec('stepOut');
            debuggerContinue();
		});
		
		$logPanel.find('.continue').on('click', function() {
			nodeDebuggerDomain.exec('continue');
            debuggerContinue();
		});
		
		$debuggerInput.on('keypress', function(e) {
            if(e.keyCode == 13) {
                var com = $debuggerInput.html();

                if(com.length > 0) {
                    addLog('>> ' + com);
                    nodeDebuggerDomain.exec('eval', com);
                    //reset the input field
                    $debuggerInput.html('');
                }
            }
		});
	});

    // Function to run when the menu item is clicked
    function toggleLog() {
        panel.setVisible(!panel.isVisible());
    }
    
    function debuggerContinue() {
        $logPanel.find('a.active').addClass('inactive').removeClass('active');
        if(highlightCm) {
            highlightCm.removeLineClass( activeLine , 'node-debugger-highlight-background', 'node-debugger-highlight');
            highlightCm = null;
            activeLine = null;
        }
    }

    var MY_COMMAND_ID = "brackets-node-debugger.log";
    CommandManager.register("Node.js Debugger", MY_COMMAND_ID, toggleLog);

    // Then create a menu item bound to the command
    // The label of the menu item is the name we gave the command (see above)
    var menu = Menus.getMenu('debug-menu');
    menu.addMenuItem(MY_COMMAND_ID);
	
	
	var panel = PanelManager.createBottomPanel("brackets-node-debugger.log", $(logContainerHTML));
	$logPanel = panel.$panel;
    $debuggerContent = $logPanel.find('#brackets-node-debugger-content');
    $debuggerInput = $logPanel.find('#brackets-node-debugger-input');

    // We could also add a key binding at the same time:
    //menu.addMenuItem(MY_COMMAND_ID, "Ctrl-Shift-I");
    // (Note: "Ctrl" is automatically mapped to "Cmd" on Mac)
});