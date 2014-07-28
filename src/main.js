/*!
 * Brackets Node Debugger
 *
 * @author Benjamin August
 * @license http://opensource.org/licenses/MIT
 */

/*global define, brackets, $ */
define(function (require, exports, module) {
	"use strict";

	var CommandManager = brackets.getModule("command/CommandManager"),
		Menus = brackets.getModule("command/Menus"),
		StatusBar = brackets.getModule("widgets/StatusBar"),
		KeyBindingManager  = brackets.getModule("command/KeyBindingManager"),
		AppInit        = brackets.getModule("utils/AppInit"),
		NodeDomain = brackets.getModule("utils/NodeDomain"),
		PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
		prefs = PreferencesManager.getExtensionPrefs("brackets-node-debugger"),
		ExtensionUtils = brackets.getModule("utils/ExtensionUtils");

	var changelogDialog = require('./changelogDialog'),
		nodeDebuggerPanel = require('./debuggerPanel').debuggerPanel;

	var nodeDebuggerDomain = new NodeDomain("brackets-node-debugger", ExtensionUtils.getModulePath(module, "../node/main"));

	var NodeDebugger = {};

	/**
	*Initalize the Debugger
	**/
	NodeDebugger.init = function() {
		AppInit.appReady(function() {
			//Show the CHANGELOG on update
			changelogDialog.show();
			//Initalize the debugger panel
			nodeDebuggerPanel.init(nodeDebuggerDomain);

			//Load Modules
			var debug = require('./debugger/debugger').debug,
				breakpoints = require('./breakpoints/breakpoints').breakpoints,
				locals = require('./locals/locals').locals;

			debug.init(nodeDebuggerDomain);
			breakpoints.init(nodeDebuggerDomain),
			locals.init(nodeDebuggerDomain);

			//Auto Connector active
			if(prefs.get("autoConnect")) {
				nodeDebuggerDomain.exec("start", prefs.get("debugger-port"), prefs.get("debugger-host"), true, prefs.get("lookupDepth"));
				var $sb = $("<div>").addClass("ion-android-developer").on('click', function() {
					nodeDebuggerPanel.toggle();
				});
				StatusBar.addIndicator("node-debugger-indicator", $sb, true, null, "Node.js Debugger");
			}
		});
	};

	//Add to menu/keyBinding
	var MY_COMMAND_ID = "brackets-node-debugger.log";
	CommandManager.register("Node.js Debugger", MY_COMMAND_ID, nodeDebuggerPanel.toggle);


	var menu = Menus.getMenu('debug-menu');
	menu.addMenuItem(MY_COMMAND_ID);
	KeyBindingManager.addBinding(MY_COMMAND_ID, "Ctrl-Shift-I");

	exports.nodeDebugger = NodeDebugger;
});
