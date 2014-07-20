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
        Menus = brackets.getModule("command/Menus"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        FileUtils = brackets.getModule("file/FileUtils"),
        StatusBar = brackets.getModule("widgets/StatusBar"),
        KeyBindingManager  = brackets.getModule("command/KeyBindingManager"),
		AppInit        = brackets.getModule("utils/AppInit"),
		PanelManager = brackets.getModule("view/PanelManager"),
        NodeDomain = brackets.getModule("utils/NodeDomain"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        prefs = PreferencesManager.getExtensionPrefs("brackets-node-debugger");
	
    ExtensionUtils.loadStyleSheet(module, "assets/style.css");
    ExtensionUtils.loadStyleSheet(module, "assets/ionicons.css");
	
	var breakpointGutters = require('./src/breakpointGutter'),
        changelogDialog = require('./src/changelogDialog'),
        nodeDebuggerPanel = require('./src/nodeDebuggerPanel');
	
	var logContainerHTML = require("text!assets/debuggerLog.html");
	
	var $logPanel = $(null),
        activeLine = null,
        highlightCm = null;

    prefs.definePreference("debugger-port", "number", 5858);
    prefs.definePreference("debugger-host", "string", "localhost");
    prefs.definePreference("showChangelogOnUpdate", "boolean", true);
    prefs.definePreference("lastVersion", "string", "none");
    prefs.definePreference("autoConnectOnToggle", "boolean", false);
    prefs.definePreference("autoConnect", "boolean", false);
	
	var nodeDebuggerDomain = new NodeDomain("brackets-node-debugger", ExtensionUtils.getModulePath(module, "node/main"));
	
	AppInit.appReady(function() {
        //Show Changelog on update (with warning to restart Brackets!)
        if(prefs.get("showChangelogOnUpdate")) {
            var path = ExtensionUtils.getModulePath(module, 'package.json');
            FileUtils.readAsText(FileSystem.getFileForPath(path)).done(function (content) {
                var version = JSON.parse(content).version;
                var lastVersion = prefs.get("lastVersion");

                if(lastVersion !== version) {
                    changelogDialog.show();
                }
                prefs.set("lastVersion", version);
                prefs.save();
            });
        }

		breakpointGutters.init(nodeDebuggerDomain);
        nodeDebuggerPanel.init(nodeDebuggerDomain, $logPanel);

        //AutoConnect
        if(prefs.get("autoConnect")) {
            nodeDebuggerDomain.exec("start", prefs.get("debugger-port"), prefs.get("debugger-host"), true);
        var $sb = $("<div>").addClass("ion-android-developer");
        StatusBar.addIndicator("node-debugger-indicator", $sb, true, null, "Node.js Debugger");
        }

		$(nodeDebuggerDomain).on("connect", function() {
			nodeDebuggerPanel.log( $('<span>').text('Debugger connected') );
            $logPanel.find('.activate').addClass('ion-ios7-checkmark')
                                    .removeClass('ion-ios7-close');
            $logPanel.find('a.inactive').addClass('active').removeClass('inactive');
            $('#node-debugger-indicator').addClass('connected');
		});

		$(nodeDebuggerDomain).on("close", function(e, err) {
            var msg = "Debugger disconnected";
            if(err) {
                msg += ": " + err;
            }

            if(err === 'ECONNREFUSED') {
                msg = "Couldn't connect to " + prefs.get("debugger-port") + ":" + prefs.get("debugger-host");
            }
            breakpointGutters.removeAllBreakpoints();
			nodeDebuggerPanel.log( $('<span>').text(msg) );

            $logPanel.find('.activate').addClass('ion-ios7-close')
                                    .removeClass('ion-ios7-checkmark');
            $logPanel.find('a.active').addClass('inactive').removeClass('active');
            $('#node-debugger-indicator').removeClass('connected');

            //remove highlight
            if(highlightCm) {
                highlightCm.removeLineClass( activeLine , 'node-debugger-highlight-background', 'node-debugger-highlight');
                highlightCm = null;
                activeLine = null;
            }
		});
		
		$(nodeDebuggerDomain).on("break", function(e, body) {
            //Fixme: Just to support windows, however this most likely won't work in every case
			var docPath = body.script.name.replace(/\\/g, '/');
			
			//console.log(body);

			
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
            var $wrapper = $('<span>').addClass('wrapper');
            $('<span>').addClass('type').text(body.type).appendTo($wrapper);
            var $output = $('<span>');

            if(body.type === 'object' && body.properties && body.lookup) {
                var o = {};
                body.properties.forEach(function(p) {
                    o[p.name] = body.lookup[p.ref].text;
                });
                $output.text( JSON.stringify(o) );
            } else {
                $output.text( body.text );
            }
            $output.appendTo($wrapper);
			nodeDebuggerPanel.log($wrapper);
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
			nodeDebuggerDomain.exec("start", prefs.get("debugger-port"), prefs.get("debugger-host"), false);
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

        //Open panel on status indicator click
        $('#node-debugger-indicator').on('click', function() {
            toggleLog();
        });
	});

    // Function to run when the menu item is clicked
    function toggleLog() {
        panel.setVisible(!panel.isVisible());
        //try to connect on toggle?
        if(prefs.get("autoConnectOnToggle") && panel.isVisible()) {
            nodeDebuggerDomain.exec("start", prefs.get("debugger-port"), prefs.get("debugger-host"), false);
        }
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
    KeyBindingManager.addBinding(MY_COMMAND_ID, "Ctrl-Shift-I");
	
	
	var panel = PanelManager.createBottomPanel("brackets-node-debugger.log", $(logContainerHTML));
	$logPanel = panel.$panel;
});