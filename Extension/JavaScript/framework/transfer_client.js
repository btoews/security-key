function TransferClient() {
  this.transferElt = document.getElementById('js-transfer');
  this.transfer = this.transferElt.dataset;
  this.serverReady = false;
  this.reqReady = false;

  // Either side can ping. Ping+Pong -> serverReady
  this.transferElt.addEventListener('serverPong', function(){
    console.log('Event: serverPong');
    this.serverReady = true;
    this.sendRequestIfReady();
  }.bind(this));

  this.transferElt.addEventListener('serverPing', function() {
    console.log('Event: serverPing');
    this.transferElt.dispatchEvent(new Event('clientPong'));
    this.serverReady = true;
    this.sendRequestIfReady();
  }.bind(this));

  this.transferElt.dispatchEvent(new Event('clientPing'));
}

TransferClient.prototype.sign = function(appId, toSign) {
  return new Promise(function(resolve, reject) {
    this.transfer.request = {'type': 'sign', 'appId': appId, 'toSign': toSign};

    this.transferElt.addEventListener('response', function(){
      console.log('Event: response');
      resolve(this.transfer.response);
    }.bind(this));

    this.reqReady = true;
    this.sendRequestIfReady();
  });
};

TransferClient.prototype.sendRequestIfReady = function() {
  if (this.serverReady && this.reqReady) {
    this.serverReady = this.reqReady = false;
    this.transferElt.dispatchEvent(new Event('request'));
  }
};
