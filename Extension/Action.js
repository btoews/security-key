function TransferServer() {
    this.transferElt = document.getElementById("js-transfer"), this.transfer = this.transferElt.dataset, 
    this.extReady = !1, this.clientReady = !1, this.eventFired("request").then(function() {
        this.clientReady = !0, this.sendRequestIfReady();
    }.bind(this)), this.eventFired("clientPing").then(function() {
        this.transferElt.dispatchEvent(new Event("serverPong"));
    }.bind(this)), this.transferElt.dispatchEvent(new Event("serverPing"));
}

var transferServer, ExtensionPreprocessingJS;

TransferServer.prototype.run = function(parameters) {
    this.extensionCallBack = parameters.completionFunction, this.extReady = !0, this.sendRequestIfReady();
}, TransferServer.prototype.finalize = function(parameters) {
    this.transfer.response = JSON.stringify(parameters), this.transferElt.dispatchEvent(new Event("response"));
}, TransferServer.prototype.sendRequestIfReady = function() {
    if (this.extReady && this.clientReady) {
        this.extReady = this.clientReady = !1;
        var parsed = JSON.parse(this.transfer.request);
        this.extensionCallBack(parsed);
    }
}, TransferServer.prototype.eventFired = function(name) {
    return new Promise(function(resolve, reject) {
        this.transferElt.addEventListener(name, resolve);
    }.bind(this));
}, transferServer = new TransferServer(), ExtensionPreprocessingJS = transferServer;
