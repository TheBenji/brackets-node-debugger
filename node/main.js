var debugConnector = require('./lib/debug.js').debugConnector;

var _domainManager,
	debug;


function stepNext() {
	var obj = {};
	obj.command = 'continue';
	obj.arguments = { 'stepaction': 'next' };
	
	debug.sendCommand(obj);
}

function stepIn() {
	var obj = {};
	obj.command = 'continue';
	obj.arguments = { 'stepaction': 'in' };
	
	debug.sendCommand(obj);
}

function stepOut() {
	var obj = {};
	obj.command = 'continue';
	obj.arguments = { 'stepaction' : 'out' };
	
	debug.sendCommand(obj);
}

function stepContinue() {
	var obj = {};
	obj.command = 'continue';
	
	debug.sendCommand(obj);
}

function setBreakpoint(file, line) {
    var obj = {};

    //Windows work around
    if(file.search(':') !== -1) {
        file = file.split('/').join('\\');
    }

    obj.command = 'setbreakpoint';
    obj.arguments = {
        'type' : 'script',
        'target' : file,
        'line': line
    };

    obj.callback = function(c, body) {
      _domainManager.emitEvent("brackets-node-debugger", "setBreakpoint", body);
    };

    debug.sendCommand(obj);
}

function removeBreakpoint(breakpoint) {
    var obj = {};
    obj.command = 'clearbreakpoint';
    obj.arguments = { 'breakpoint' : breakpoint };

    obj.callback = function(c, body) {
      _domainManager.emitEvent("brackets-node-debugger", "clearBreakpoint", body);
    };

    debug.sendCommand(obj);
}

function evaluate(com) {
	var obj = {};
	obj.command = 'evaluate';
	obj.arguments = { 'expression' : com };

    obj.callback = function(c, body) {
      _domainManager.emitEvent("brackets-node-debugger", "eval", body);
    };
	
	debug.sendCommand(obj);
}

function lookup(handles) {
    var obj = {};
    obj.command = 'lookup';
    obj.arguments = { 'handles': handles };

    obj.callback = function(c, body) {
      console.log(body);
    };

    debug.sendCommand(obj);
}

function start() {
    //TODO: Port should be configurable
	debug = new debugConnector();
	
	debug.on('connect', function() {
		_domainManager.emitEvent("brackets-node-debugger", "connect");
	});

    debug.on('error', function(err) {
        console.error('[Node-Debugger] Error: ' + err);
    });
	
	debug.on('close', function() {
		_domainManager.emitEvent("brackets-node-debugger", "close");
	});
	
	debug.on('break', function(body) {
		_domainManager.emitEvent("brackets-node-debugger", "break", body);
	});
}

function init(domainManager) {
	_domainManager = domainManager;
    
    if (!domainManager.hasDomain("brackets-node-debugger")) {
        domainManager.registerDomain("brackets-node-debugger", {major: 0, minor: 1});
    }
	
	_domainManager.registerCommand(
		"brackets-node-debugger",
		"start",
		start,
		false,
		"Start the socket to listen to the debugger"
	);
	
	_domainManager.registerCommand(
		"brackets-node-debugger",
		"stepNext",
		stepNext,
		false,
		"Continue with action 'next'"
	);
	
	_domainManager.registerCommand(
		"brackets-node-debugger",
		"stepIn",
		stepIn,
		false,
		"Continue with action 'In'"
	);
	
	_domainManager.registerCommand(
		"brackets-node-debugger",
		"stepOut",
		stepOut,
		false,
		"Continue with action 'out'"
	);
	
	_domainManager.registerCommand(
		"brackets-node-debugger",
		"continue",
		stepContinue,
		false,
		"Continue running the script"
	);
	
	
	_domainManager.registerCommand(
		"brackets-node-debugger",
		"eval",
		evaluate,
		false,
		"Evaluate an expression",
		[{
			name: "Com",
			type: "string",
			description: "The expression to evaluate"
		}]
	);
	

	_domainManager.registerCommand(
		"brackets-node-debugger",
		"setBreakpoint",
		setBreakpoint,
		false,
		"Set a new Breakpoint",
		[{
			name: "file",
			type: "string",
			description: "The path to the file where the breakpoint is to set"
		},
        {
			name: "line",
			type: "number",
			description: "The line number where the breakpoint is to set"
		}]
	);

	_domainManager.registerCommand(
		"brackets-node-debugger",
		"removeBreakpoint",
		removeBreakpoint,
		false,
		"Remove a Breakpoint",
		[{
			name: "breakpoint",
			type: "number",
			description: "The id from the breakpoint to remove"
		}]
	);

	_domainManager.registerEvent(
		"brackets-node-debugger",
		"connect"
	);
	
	_domainManager.registerEvent(
		"brackets-node-debugger",
		"close"
	);
	
	_domainManager.registerEvent(
		"brackets-node-debugger",
		"break",
		[{
			name: "Body",
			type: "{ invocationText: string, sourceLine: number, sourceColumn: number, sourceLineText: string, script: object, breakpoints: array }",
			description: "The body V8 sends us"
		}]
	);
	
	_domainManager.registerEvent(
		"brackets-node-debugger",
		"eval",
		[{
			name: "Body",
			type: "object",
			description: "The body V8 sends us as response"
		}]
	);

	_domainManager.registerEvent(
		"brackets-node-debugger",
		"setBreakpoint",
		[{
			name: "args",
			type: "object",
			description: "The Arguments V8 sends us as response"
		}]
	);

	_domainManager.registerEvent(
		"brackets-node-debugger",
		"clearBreakpoint",
		[{
			name: "args",
			type: "object",
			description: "The Arguments V8 sends us as response"
		}]
	);
}

exports.init = init;