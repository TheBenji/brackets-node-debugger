/*global define, brackets, $, Mustache */
define(function (require, exports, module) {
	"use strict";

	var Dialogs                    = brackets.getModule("widgets/Dialogs"),
		FileSystem                 = brackets.getModule("filesystem/FileSystem"),
		FileUtils                  = brackets.getModule("file/FileUtils"),
		ExtensionUtils             = brackets.getModule("utils/ExtensionUtils"),
		changelogDialogTemplate    = require("text!../assets/changelog-dialog.html"),
		PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
		prefs = PreferencesManager.getExtensionPrefs("brackets-node-debugger"),
		marked                     = require("./thirdparty/marked");

	var dialog;

	/*
	* Show the actual dialog with the CHANGELOG.MD
	*/
	function show() {
		var compiledTemplate = Mustache.render(changelogDialogTemplate);

		var path = ExtensionUtils.getModulePath(module, '../CHANGELOG.md');

		FileUtils.readAsText(FileSystem.getFileForPath(path)).done(function (content) {
			content = marked(content, {
				gfm: true,
				breaks: true
			});
			dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate);
			$("#node-debugger-changelog", dialog.getElement()).html(content);
		});
	}

	exports.show = function () {

		//Show Changelog on update (with warning to restart Brackets!)
		if(prefs.get("showChangelogOnUpdate")) {
			var path = ExtensionUtils.getModulePath(module, '../package.json');
			FileUtils.readAsText(FileSystem.getFileForPath(path)).done(function (content) {
				var version = JSON.parse(content).version;
				var lastVersion = prefs.get("lastVersion");

				if(lastVersion !== version) {
					show();
				}
				prefs.set("lastVersion", version);
				prefs.save();
			});
		}
	};

});
