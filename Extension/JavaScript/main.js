var TRANSFER = document.getElementById('js-transfer').dataset;
var Action = function() {};

Action.prototype = {
    run: function(parameters) {
      console.log("Action.run");
      console.log(parameters);
      parameters.completionFunction({appId: TRANSFER.appId, toSign: TRANSFER.toSign});
    },

    finalize: function(parameters) {
        console.log("Action.finalize");
        console.log(parameters);

        TRANSFER.publicKey = parameters['publicKey'];
        TRANSFER.signature = parameters['signature'];
        TRANSFER.certificate = parameters['certificate'];
        window.dispatchEvent(new Event('signed'));
    }
};

var ExtensionPreprocessingJS = new Action;
