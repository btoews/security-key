// Copyright (c) 2016 GitHub, inc.

var u2fClient = function() { this.pingPong(); };

u2fClient.prototype = pingerPonger;

u2fClient.prototype.register = function(appId, registerRequests, registeredKeys, responseHandler) {
  this.whenReady().then(function() {
    this.receive('response').then(responseHandler);
    this.send('request', {
      'type': 'register',
      'appId': appId,
      'registerRequests': registerRequests,
      'registeredKeys': registeredKeys
    });
  }.bind(this));
};

u2fClient.prototype.sign = function(appId, challenge, registeredKeys, responseHandler) {
  this.whenReady().then(function() {
    this.receive('response').then(responseHandler);
    this.send('request', {
      'type': 'sign',
      'appId': appId,
      'challenge': challenge,
      'registeredKeys': registeredKeys
    });
  }.bind(this));
};
