function TransferServer() {
    console.log("TransferServer()"), this.transferElt = document.getElementById("js-transfer"), 
    this.transfer = this.transferElt.dataset, this.extReady = !1, this.clientReady = !1, 
    this.transferElt.addEventListener("request", function() {
        console.log("Event: request"), this.clientReady = !0, this.sendRequestIfReady();
    }.bind(this)), this.transferElt.addEventListener("clientPing", function() {
        console.log("Event: clientPong"), this.transferElt.dispatchEvent(new Event("serverPong"));
    }.bind(this)), this.transferElt.dispatchEvent(new Event("serverPing"));
}

var transferServer, ExtensionPreprocessingJS;

TransferServer.prototype.run = function(parameters) {
    console.log("TransferServer.prototype.run"), this.extensionCallBack = parameters.completionFunction, 
    this.extReady = !0, this.sendRequestIfReady();
}, TransferServer.prototype.finalize = function(parameters) {
    console.log("TransferServer.prototype.finalize"), this.transfer.response = parameters, 
    this.transferElt.dispatchEvent(new Event("response"));
}, TransferServer.prototype.sendRequestIfReady = function() {
    this.extReady && this.clientReady && (console.log("calling extensionCallBack"), 
    console.log(this.transfer.request), this.extReady = this.clientReady = !1, this.extensionCallBack(this.transfer.request));
}, transferServer = new TransferServer(), ExtensionPreprocessingJS = transferServer;
