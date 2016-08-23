var ExtensionBridge = function() {};

ExtensionBridge.prototype.sign = function(appId, toSign) {
  return new Promise(function(resolve, reject) {
    this.resolve = resolve;
    this.reject = reject;
    this.request = {'type': 'sign', 'appId': appId, 'toSign': toSign};
    this.sendRequest();
  });
};

ExtensionBridge.prototype.run = function(parameters) {
  this.extensionCallBack = parameters.completionFunction;
  this.sendRequest();
};

ExtensionBridge.prototype.sendRequest = function() {
  if (typeof this.request == 'undefined') {
    return
  }

  if (typeof this.extensionCallBack == 'undefined') {
    return
  }

  this.extensionCallBack(this.request);
};

ExtensionBridge.prototype.finalize = function(parameters) {
  this.resolve(parameters);
};
