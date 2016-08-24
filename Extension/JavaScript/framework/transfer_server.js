function TransferServer(){
  this.transferElt = document.getElementById('js-transfer');
  this.transfer = this.transferElt.dataset;
  this.extReady = false;
  this.clientReady = false;

  this.eventFired('request').then(function() {
    this.clientReady = true;
    this.sendRequestIfReady();
  }.bind(this));

  this.eventFired('clientPing').then(function() {
    this.transferElt.dispatchEvent(new Event('serverPong'));
  }.bind(this));

  this.transferElt.dispatchEvent(new Event('serverPing'));
};

TransferServer.prototype.run = function(parameters) {
  this.extensionCallBack = parameters.completionFunction;
  this.extReady = true;
  this.sendRequestIfReady();
};

TransferServer.prototype.finalize = function(parameters) {
  this.transfer.response = JSON.stringify(parameters);
  this.transferElt.dispatchEvent(new Event('response'));
};

TransferServer.prototype.sendRequestIfReady = function() {
  if (this.extReady && this.clientReady) {
    this.extReady = this.clientReady = false;
    var parsed = JSON.parse(this.transfer.request)
    this.extensionCallBack(parsed);
  }
}

TransferServer.prototype.eventFired = function(name) {
  return new Promise(function(resolve, reject) {
    this.transferElt.addEventListener(name, resolve);
  }.bind(this));
};
