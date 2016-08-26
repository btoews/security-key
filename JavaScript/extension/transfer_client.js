// Copyright (c) 2016 GitHub, inc.

function TransferClient() {
  this.transferElt = document.getElementById('js-transfer');
  this.transfer = this.transferElt.dataset;
  this.serverReady = false;
  this.reqReady = false;

  // Either side can ping. Ping+Pong -> serverReady
  this.eventFired('serverPong').then(function() {
    this.serverReady = true;
    this.sendRequestIfReady();
  }.bind(self));

  this.eventFired('serverPing').then(function() {
    this.transferElt.dispatchEvent(new Event('clientPong'));
    this.serverReady = true;
    this.sendRequestIfReady();
  }.bind(this));

  this.transferElt.dispatchEvent(new Event('clientPing'));
}

TransferClient.prototype.sign = function(appId, toSign) {
  this.transfer.request = JSON.stringify(
    {'type': 'sign', 'appId': appId, 'toSign': JSON.stringify(toSign)}
  );

  var promise = this.eventFired('response').then(function() {
    var parsed = JSON.parse(this.transfer.response);
    return Promise.resolve(parsed.signature);
  }.bind(this));

  this.reqReady = true;
  this.sendRequestIfReady();

  return promise;
};

TransferClient.prototype.register = function(appId, toSign) {
  this.transfer.request = JSON.stringify(
    {'type': 'register', 'appId': appId, 'toSign': JSON.stringify(toSign)}
  );

  var promise = this.eventFired('response').then(function() {
    var parsed = JSON.parse(this.transfer.response);
    return Promise.resolve(parsed);
  }.bind(this));

  this.reqReady = true;
  this.sendRequestIfReady();

  return promise;
};

TransferClient.prototype.eventFired = function(name) {
  return new Promise(function(resolve, reject) {
    this.transferElt.addEventListener(name, resolve);
  }.bind(this));
};

TransferClient.prototype.sendRequestIfReady = function() {
  if (this.serverReady && this.reqReady) {
    this.serverReady = this.reqReady = false;
    this.transferElt.dispatchEvent(new Event('request'));
  }
};
