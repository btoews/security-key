function TransferServer(){
  this.transferElt = document.getElementById('js-transfer');
  this.transfer = this.transferElt.dataset;
  this.extReady = false;
  this.clientReady = false;

  this.transferElt.addEventListener('request', function(){
    console.log('Event: request');
    this.clientReady = true;
    this.sendRequestIfReady();
  }.bind(this));

  this.transferElt.addEventListener('clientPing', function() {
    console.log('Event: clientPong');
    this.transferElt.dispatchEvent(new Event('serverPong'));
  }.bind(this));

  this.transferElt.dispatchEvent(new Event('serverPing'));
};

TransferServer.prototype.run = function(parameters) {
  console.log('TransferServer.prototype.run');
  this.extensionCallBack = parameters.completionFunction;
  this.extReady = true;
  this.sendRequestIfReady();
};

TransferServer.prototype.finalize = function(parameters) {
  console.log('TransferServer.prototype.finalize');
  this.transfer.response = parameters;
  this.transferElt.dispatchEvent(new Event('response'));
};

TransferServer.prototype.sendRequestIfReady = function() {
  if (this.extReady && this.clientReady) {
    this.extReady = this.clientReady = false;
    this.extensionCallBack(this.transfer.request);
  }
}
