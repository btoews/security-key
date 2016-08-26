// Copyright (c) 2016 GitHub, inc.

var ExtensionBridge = function() {};

ExtensionBridge.prototype.sign = function(keyHandle, toSign) {
  return new Promise(function(resolve, reject) {
    this.request = {'type': 'sign', 'keyHandle': keyHandle, 'toSign': JSON.stringify(toSign)};
    this.sendResponse = function(parameters) {
      resolve(parameters.signature);
    };

    this.sendRequest();
  }.bind(this));
};

ExtensionBridge.prototype.register = function(keyHandle, toSign) {
  return new Promise(function(resolve, reject) {
    this.request = {'type': 'register', 'keyHandle': keyHandle, 'toSign': JSON.stringify(toSign)};
    this.sendResponse = resolve;

    this.sendRequest();
  }.bind(this));
};

ExtensionBridge.prototype.run = function(parameters) {
  this.extensionCallBack = parameters.completionFunction;
  this.sendRequest();
};

ExtensionBridge.prototype.sendRequest = function() {
  if (typeof this.request == 'undefined') {
    return;
  }

  if (typeof this.extensionCallBack == 'undefined') {
    return;
  }

  this.extensionCallBack(this.request);
};

ExtensionBridge.prototype.finalize = function(parameters) {
  this.sendResponse(parameters);
};
