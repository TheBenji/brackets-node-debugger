var net = require('net'),
	events = require('events'),
	util = require('util');

var debugConnector = function() {
	var self = this;
	
	events.EventEmitter.call(this);
	
	this.port = 5858;
	this.host = 'localhost';
	this.connected = false;
	
	this._seq = 0;
    this._waitingForResponse = {};
	
	//Create connection to V8 Debugger
	this.socket = net.createConnection(self.port, self.host);
	
	this.socket.on('connect', function() {
		self.connected = true;
		self.emit('connect');
	});
	
	this.socket.on('error', function(err) {
		self.emit('error', err);
	});
	
	this.socket.on('close', function(err) {
		self.connected = false;
		self.emit('close', err);
	});
	
	this.socket.on('data', function(data) {
		try {
			var body = JSON.parse( data.toString() );
			console.log('Seq %d Event %s', body.seq, body.type);
            //console.log(body);
			
			if(body.event === 'break') {
				self.emit('break', body.body);	
			}
			
			if(body.type === 'response') {
				if(body.command === 'evaluate') {
					self.emit('eval', body.body);
				}

                if(body.command === 'setbreakpoint') {
                    self.emit('setBreakpoint', body.body);
                }

                if(body.command === 'clearbreakpoint') {
                    self.emit('clearBreakpoint', body.body);
                }

                delete self._waitingForResponse[body.request_seq];
			}
		} catch(e) {
			//Just ignore it for now	
		}
	});
};

util.inherits(debugConnector, events.EventEmitter);

debugConnector.prototype.sendCommand = function(obj) {
	var self = this;
	
	if(self.connected) {
		obj.seq = ++self._seq;
		obj.type = 'request';

		console.log('Send: ');
		console.log(obj);

		var str = JSON.stringify(obj);

        self._waitingForResponse[obj.seq] = obj;
		self.socket.write( "Content-Length:" + str.length + "\r\n\r\n" + str);
	} else {
		console.error('[Node-Debugger] Can\'t send command, not connected!');	
	}
};

module.exports = {
	debugConnector: debugConnector
}