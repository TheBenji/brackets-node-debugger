var net = require('net'),
	events = require('events'),
	util = require('util');

var debugConnector = function() {
	events.EventEmitter.call(this);

	this.port = 5858;
	this.host = 'localhost';
	this.connected = false;

	this._seq = 0;
	this._waitingForResponse = {};
	this._body = '';
	this._header = true;
	this._contentLength = 0;

	this._debug = false;
};

util.inherits(debugConnector, events.EventEmitter);

debugConnector.prototype.connect = function() {
	var self = this;
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
		var l = data.toString().split('\r\n');
		//console.log( data.toString() );

		l.forEach(function( line ) {

			//after the header there is just an empty line
			if (!line) {
				self._header = false;
				return;
			}

			//If we are still in the header check the content length
			if( self._header ) {
				var h = line.split(':');
				//Check if that is really the content-length
				if( h[0] === 'Content-Length') {
					self._contentLength = parseInt(h[1], 10);
				}
			} else {
				//If we're in the body save the content
				self._body += line;
			}
		});

		var responseIgnored = true;

		//FIXME: Do that properly...
		if(self._body.length >= self._contentLength) {
			try {
				var body = JSON.parse( self._body );
				//console.log(body);

				if(body.event === 'break') {
					self.emit('break', body.body);
					responseIgnored = false;
				}

				if(body.type === 'response') {

					if(self._waitingForResponse[body.request_seq].callback) {
						responseIgnored = false;
						self._waitingForResponse[body.request_seq].callback(body.command, body.body, body.running);
					}

					delete self._waitingForResponse[body.request_seq];
				}
			} catch(e) {
				//Just ignore it for now
				//TODO Print node/debugger version on connect
				//console.log('Unvalid response: ' + data.toString() );
			}

			//reset header && body
			self._header = true;
			self._body = '';
		}
		if(responseIgnored && self._debug) {
			console.log('[Node Debugger] V8 Response ignored: ');
			console.log(data.toString());
		}
	});
};

debugConnector.prototype.sendCommand = function(obj) {
	var self = this;

	if(self.connected) {
		obj.seq = ++self._seq;
		obj.type = "request";

		var str = JSON.stringify(obj);

		//console.log('Send: ');
		//console.log(str);

		self._waitingForResponse[obj.seq] = obj;
		self.socket.write( "Content-Length:" + str.length + "\r\n\r\n" + str);
	} else {
		//Just ignore it, that is ok
		//console.error('[Node-Debugger] Can\'t send command, not connected!');
	}
};

module.exports = {
	debugConnector: debugConnector
}
