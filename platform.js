'use strict';

var inherits     = require('util').inherits,
	EventEmitter = require('events').EventEmitter;

/**
 * Utility function to validate String Objects
 * @param val The value to be evaluated.
 * @returns {boolean}
 */
var isString = function (val) {
	return typeof val === 'string' || ((!!val && typeof val === 'object') && Object.prototype.toString.call(val) === '[object String]');
};

/**
 * Utility function to validate Error Objects
 * @param val The value to be evaluated.
 * @returns {boolean}
 */
var isError = function (val) {
	return (!!val && typeof val === 'object') && typeof val.message === 'string' && Object.prototype.toString.call(val) === '[object Error]';
};

/**
 * Main object used to communicate with the platform.
 * @returns {Platform}
 * @constructor
 */
function Platform() {
	if (!(this instanceof Platform)) return new Platform();

	EventEmitter.call(this);
	Platform.init.call(this);
}

inherits(Platform, EventEmitter);

/**
 * Init function for Platform.
 */
Platform.init = function () {
	var self = this;

	process.on('SIGINT', function () {
		self.emit('close');

		setTimeout(function () {
			self.removeAllListeners();
			process.exit();
		}, 2000);
	});

	process.on('SIGTERM', function () {
		self.emit('close');

		setTimeout(function () {
			self.removeAllListeners();
			process.exit();
		}, 2000);
	});

	process.on('uncaughtException', function (error) {
		console.error('Uncaught Exception', error);
		self.handleException(error);
		self.emit('close');

		setTimeout(function () {
			self.removeAllListeners();
			process.exit(1);
		}, 2000);
	});

	process.on('message', function (m) {
		if (m.type === 'ready')
			self.emit('ready', m.data.options, m.data.devices);
		else if (m.type === 'message')
			self.emit('message', m.data);
		else if (m.type === 'adddevice')
			self.emit('adddevice', m.data);
		else if (m.type === 'removedevice')
			self.emit('removedevice', m.data);
		else if (m.type === 'close')
			self.emit('close');
	});
};

/**
 * Needs to be called once in order to notify the platform that the plugin has already finished the init process.
 * @param {function} [callback] Optional callback to be called once the ready signal has been sent.
 */
Platform.prototype.notifyReady = function (callback) {
	callback = callback || function () {
		};

	setImmediate(function () {
		process.send({
			type: 'ready'
		}, callback);
	});
};

/**
 * Notify the platform that the device has connected to this gateway. The platform will update the device status to online.
 * @param {string} device The client or device identifier.
 * @param {function} [callback] Optional callback to be called once the connection signal has been sent.
 */
Platform.prototype.notifyConnection = function (device, callback) {
	callback = callback || function () {
		};

	setImmediate(function () {
		if (!device || !isString(device)) return callback(new Error('A valid client/device identifier is required.'));

		process.send({
			type: 'connection',
			data: device
		}, callback);
	});
};

/**
 * Notify the platform that the device has disconnected from this gateway. The platform will update the device status to offline.
 * @param {string} device The client or device identifier.
 * @param {function} [callback] Optional callback to be called once the disconnect signal has been sent.
 */
Platform.prototype.notifyDisconnection = function (device, callback) {
	callback = callback || function () {
		};

	setImmediate(function () {
		if (!device || !isString(device)) return callback(new Error('A valid client/device identifier is required.'));

		process.send({
			type: 'disconnect',
			data: device
		}, callback);
	});
};

/**
 * Notifies the platform that resources have been released and this plugin can shutdown gracefully.
 * @param {function} [callback] Optional callback to be called once the close signal has been sent.
 */
Platform.prototype.notifyClose = function (callback) {
	callback = callback || function () {
		};

	setImmediate(function () {
		process.send({
			type: 'close'
		}, callback);
	});
};

/**
 * Sends the device/sensor data to the platform to be processed.
 * @param {string} device The client or device identifier.
 * @param {string} data The JSON data to be processed.
 * @param callback Optional callback to be called once the data has been sent.
 */
Platform.prototype.processData = function (device, data, callback) {
	callback = callback || function () {
		};

	setImmediate(function () {
		if (!device || !isString(device)) return callback(new Error('A valid client/device identifier is required.'));
		if (!data || !isString(data)) return callback(new Error('A valid data is required.'));

		process.send({
			type: 'data',
			data: {
				device: device,
				data: data
			}
		}, callback);
	});
};

/**
 * Send a message or command to a device.
 * @param {string} device The device identifier to send the message or command to.
 * @param {string} message The message or command to be sent to the device.
 * @param {function} [callback] Optional callback to be called once the message has been sent.
 */
Platform.prototype.sendMessageToDevice = function (device, message, callback) {
	callback = callback || function () {
		};

	setImmediate(function () {
		if (!device || !isString(device)) return callback(new Error('A valid device id is required.'));
		if (!message || !isString(message)) return callback(new Error('A valid message is required.'));

		process.send({
			type: 'message',
			data: {
				device: device,
				message: message
			}
		}, callback);
	});
};

/**
 * Send a message or command to a group of devices.
 * @param {string} group The device group name.
 * @param {string} message The message or command to send to the group of devices.
 * @param {function} [callback] Optional callback to be called once the message has been sent.
 */
Platform.prototype.sendMessageToGroup = function (group, message, callback) {
	callback = callback || function () {
		};

	setImmediate(function () {
		if (!group || !isString(group)) return callback(new Error('A valid group name is required.'));
		if (!message || !isString(message)) return callback(new Error('A valid message is required.'));

		process.send({
			type: 'message',
			data: {
				group: group,
				message: message
			}
		}, callback);
	});
};

/**
 * Sends back a response to the message sent to the device through this gateway. These responses may be acknowledgement receipts that
 * come from the devices connected to this gateway.
 * @param {string} messageId The message id that was sent
 * @param response
 * @param callback
 */
Platform.prototype.sendMessageResponse = function (messageId, response, callback) {
	callback = callback || function () {
		};

	setImmediate(function () {
		if (!messageId || !isString(messageId)) return callback(new Error('A valid message id is required.'));
		if (!response || !isString(response)) return callback(new Error('A valid response is required.'));

		process.send({
			type: 'response',
			data: {
				messageId: messageId,
				response: response
			}
		}, callback);
	});
};

/**
 * Logs any data to the attached loggers in the topology.
 * @param {string} data The data that needs to be logged.
 * @param {function} [callback] Optional callback to be called once the data has been sent.
 */
Platform.prototype.log = function (data, callback) {
	callback = callback || function () {
		};

	setImmediate(function () {
		if (!data || !isString(data)) return callback(new Error('A valid log data is required.'));

		process.send({
			type: 'log',
			data: data
		}, callback);
	});
};

/**
 * Logs errors to all the attached exception handlers in the topology.
 * @param {error} error The error to be handled/logged
 * @param {function} [callback] Optional callback to be called once the error has been sent.
 */
Platform.prototype.handleException = function (error, callback) {
	callback = callback || function () {
		};

	setImmediate(function () {
		if (!isError(error)) return callback(new Error('A valid error object is required.'));

		process.send({
			type: 'error',
			data: {
				name: error.name,
				message: error.message,
				stack: error.stack
			}
		}, callback);
	});
};

module.exports = new Platform();
