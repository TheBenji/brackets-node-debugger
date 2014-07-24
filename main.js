/*!
 * Brackets Node Debugger
 *
 * @author Benjamin August
 * @license http://opensource.org/licenses/MIT
 */

/*global define, brackets */
define(function (require, exports, module) {
	"use strict";

	var PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
		ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
		prefs = PreferencesManager.getExtensionPrefs("brackets-node-debugger");

	//Define all Preferences
	prefs.definePreference("debugger-port", "number", 5858);
	prefs.definePreference("debugger-host", "string", "localhost");
	prefs.definePreference("showChangelogOnUpdate", "boolean", true);
	prefs.definePreference("lastVersion", "string", "none");
	prefs.definePreference("autoConnectOnToggle", "boolean", false);
	prefs.definePreference("autoConnect", "boolean", false);
	prefs.definePreference("removeBreakpointsOnDisconnect", "boolean", false);
	prefs.definePreference("lookupDepth", "number", 4);

	//Load Assets
	ExtensionUtils.loadStyleSheet(module, "assets/style.css");
	ExtensionUtils.loadStyleSheet(module, "assets/ionicons.css");


	var NodeDebugger = require('./src/main').nodeDebugger;

	//Init the NodeDebugger
	NodeDebugger.init();
});