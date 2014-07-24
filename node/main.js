/*global require*/
var debugConnector = require('./lib/debug.js').debugConnector;

var _domainManager,
	debug,
	_maxDeep,
	_autoConnect;

var stepCallback = function(c, b, running) {
	if(running) {
		_domainManager.emitEvent("brackets-node-debugger", "running");
	}
};

function stepNext() {
	debug.sendCommand({
		"command": "continue",
		"callback": stepCallback,
		"arguments": {"stepaction": "next"}
	});
}

function stepIn() {
	debug.sendCommand({
		"command": "continue",
		"callback": stepCallback,
		"arguments": {"stepaction": "in"}
	});
}

function stepOut() {
	debug.sendCommand({
		"command": "continue",
		"callback": stepCallback,
		"arguments": {"stepaction": "out"}
	});
}

function stepContinue() {
	debug.sendCommand({
		"callback": stepCallback,
		"command": "continue"
	});
}

function setBreakpoint(file, line) {
	var obj = {};
	var fullPath = file;
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
		body.fullPath = fullPath;
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
		//If this is from type object get the properties as well
		if(body.type === 'object' && body.properties) {
			//Get all handles and send lookup
			var handles = [];
			body.properties.forEach(function(h) {
				handles.push(h.ref);
			});
			_recursiveLookup(handles, 0, {}, function(cmd, b) {
				//Add the lookup stuff and emit the event
				body.lookup = b;
				_domainManager.emitEvent("brackets-node-debugger", "eval", body);
			});
		} else {
			_domainManager.emitEvent("brackets-node-debugger", "eval", body);
		}
	};
	
	debug.sendCommand(obj);
}

function _recursiveLookup(handles, depth, objects, callback) {
	debug.sendCommand({
		"command": "lookup",
		"arguments": { 'handles': handles },
		"callback": function(c, body) {

			var newHandles = [];
			//Go through every object, get the handles and send it again
			Object.keys(body).forEach(function(b){
				b = body[b];
				if(b.type === 'object' && b.properties) {
					b.properties.forEach(function(p) {
						newHandles.push(p.ref);
					});
				}
			});


			Object.keys(body).forEach(function(o){
				o = body[o];
				objects[o.handle] = o;
			});

			depth++;
			if(depth < _maxDeep) {
				_recursiveLookup(newHandles, depth, objects, callback);
			} else {
				callback(c, objects);
			}
		}
	});
}

function disconnect() {
	//Make sure that you don't connect again
	_autoConnect = false;
	debug.sendCommand({
		"command": "disconnect"
	});
}

function getBreakpoints() {
	debug.sendCommand({
		"command": "listbreakpoints",
		"callback": function(c, body) {
			_domainManager.emitEvent("brackets-node-debugger", "allBreakpoints", body);
		}
	});
}

function start(port, host, autoConnect, maxDepth) {
	_autoConnect = autoConnect;

	_maxDeep = maxDepth;

	if(!debug) {
		debug = new debugConnector();
		setEventHandlers();
	}
	if(!debug.connected) {
		debug.port = port;
		debug.host = host;
		debug.connect();
	}
}

function setEventHandlers() {

	debug.on('connect', function() {
		_domainManager.emitEvent("brackets-node-debugger", "connect");
	});

	debug.on('error', function(err) {
		if(_autoConnect) {
			if(err.errno !== 'ECONNREFUSED') {
				_domainManager.emitEvent("brackets-node-debugger", "close", err.errno);
			}
		} else {
			_domainManager.emitEvent("brackets-node-debugger", "close", err.errno);
		}
	});

	debug.on('close', function(err) {
		if(_autoConnect) {
			//Try in a second again
			setTimeout(function() {
				start(debug.port, debug.host, _autoConnect);
			}, 2000);
		}

		if(!err) {
		  _domainManager.emitEvent("brackets-node-debugger", "close", false);
		}
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
		"Start the socket to listen to the debugger",
		[{
			name: "port",
			type: "number",
			description: "The port the V8 debugger is running on"
		},
		 {
			name: "host",
			type: "string",
			description: "The host the V8 debugger is running on"
		},
		 {
			name: "autoConnect",
			type: "boolean",
			description: "Try to reconnect on error"
		},
		 {
			name: "maxDepth",
			type: "number",
			description: "The max depth the lookup goes down"
		}
		]
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
		"disconnect",
		disconnect,
		false,
		"Disconnect from the V8 debugger"
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

	_domainManager.registerCommand(
		"brackets-node-debugger",
		"getBreakpoints",
		getBreakpoints,
		false,
		"Get a list of all Breakpoints"
	);

	_domainManager.registerEvent(
		"brackets-node-debugger",
		"connect"
	);

	_domainManager.registerEvent(
		"brackets-node-debugger",
		"running"
	);
	
	_domainManager.registerEvent(
		"brackets-node-debugger",
		"close",
		[{
			name: "error",
			type: "string",
			description: "Reason for close"
		}]
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

	_domainManager.registerEvent(
		"brackets-node-debugger",
		"allBreakpoints",
		[{
			name: "args",
			type: "object",
			description: "The Arguments V8 sends us as response"
		}]
	);
}

exports.init = init;