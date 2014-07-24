/*global define, brackets, $, Mustache */
define(function (require, exports, module) {
	"use strict";

	var Dialogs                    = brackets.getModule("widgets/Dialogs"),
		FileSystem                 = brackets.getModule("filesystem/FileSystem"),
		FileUtils                  = brackets.getModule("file/FileUtils"),
		ExtensionUtils             = brackets.getModule("utils/ExtensionUtils"),
		changelogDialogTemplate    = require("text!../assets/changelog-dialog.html"),
		marked                     = require("./thirdparty/marked");

	var dialog;

	exports.show = function () {
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
	};

});
