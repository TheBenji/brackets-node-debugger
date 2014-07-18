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
	
	var breakpointGutters = require('./breakpointGutter');
	console.log('foo!!');
	
	var logContainerHTML = require("text!debuggerLog.html");
	
	var $logPanel = $(null);
	
	var nodeDebuggerDomain = new NodeDomain("brackets-node-debugger", ExtensionUtils.getModulePath(module, "node/main"));
	
	AppInit.appReady(function() {
		breakpointGutters.init();
		//Adds a new line to the log within brackets
		function addLog(msg) {
			var h = '<div class="brackets-node-debugger-log">' + msg + '</div>';
			$(h).appendTo($logPanel.find('#brackets-node-debugger-content'));
		}


		$(nodeDebuggerDomain).on("connect", function() {
			addLog('Debugger connected');
		});

		$(nodeDebuggerDomain).on("close", function() {
			addLog('Debugger disconnected');
		});
		
		$(nodeDebuggerDomain).on("break", function(e, body) {
			var docPath = body.script.name;
			
			console.log(body);
			
			addLog("Break on: " + docPath + " : " + body.sourceLine);
			//Make sure the panel is open
			panel.setVisible(true);
			
			DocumentManager.getDocumentForPath(docPath)
				.done(function(doc) {
					DocumentManager.setCurrentDocument( doc );
					Editor.getActiveEditor().setCursorPos( body.sourceLine - 1 );
				}).fail(function(err) {
					console.log('[Node Debugger] Failed to open Document: ' + docPath);
				});
			
		});
		
		$(nodeDebuggerDomain).on("eval", function(e, body) {
			console.log(body);
			addLog('<< ' + body.value);
		});
	
		
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
		});
		
		$logPanel.find('.in').on('click', function() {
			nodeDebuggerDomain.exec('stepIn');
		});
		
		$logPanel.find('.out').on('click', function() {
			nodeDebuggerDomain.exec('stepOut');
		});
		
		$logPanel.find('.continue').on('click', function() {
			nodeDebuggerDomain.exec('continue');
		});
		
		$logPanel.find('.action').on('click', function() {
			var com = $logPanel.find('#brackets-node-debugger-input').val();
			
			if(com.length > 0) {
				addLog('>> ' + com);
				nodeDebuggerDomain.exec('eval', com);	
			}
		});
	});

    // Function to run when the menu item is clicked
    function toggleLog() {
        panel.setVisible(!panel.isVisible());
    }
    
    var MY_COMMAND_ID = "brackets-node-debugger.log";
    CommandManager.register("Node.js Debugger", MY_COMMAND_ID, toggleLog);

    // Then create a menu item bound to the command
    // The label of the menu item is the name we gave the command (see above)
    var menu = Menus.getMenu('debug-menu');
    menu.addMenuItem(MY_COMMAND_ID);
	
	
	var panel = PanelManager.createBottomPanel("brackets-node-debugger.log", $(logContainerHTML));
	$logPanel = panel.$panel;

    // We could also add a key binding at the same time:
    //menu.addMenuItem(MY_COMMAND_ID, "Ctrl-Shift-I");
    // (Note: "Ctrl" is automatically mapped to "Cmd" on Mac)
});