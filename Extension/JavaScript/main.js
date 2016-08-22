var KEY_HANDLE_SIZE = 32;
var CHALLENGE_SIZE = 32;
var U2F_VERSION = "U2F_V2";

var ExtensionBridge = function() {
  this.stack = [];
  this.extensionCallbacks = [];
};
ExtensionBridge.prototype = {
  queue: function(data, cb) {
    console.log('ExtensionBridge.queue');
    this.stack.push({data: data, cb: cb});
    this.startTransaction();
  },
  run: function(parameters) {
    console.log('ExtensionBridge.run');
    this.extensionCallbacks.push(parameters.completionFunction);
    this.startTransaction();
  },
  startTransaction: function() {
    console.log('ExtensionBridge.startTransaction');
    if (this.stack.length > 0 && this.extensionCallbacks.length > 0) {
      this.extensionCallbacks.pop()(this.stack[0].data);
    }
  },
  finalize: function(parameters){
    console.log('ExtensionBridge.finalize');
    if (this.stack.length > 0) {
      this.stack.pop().cb(parameters);
    }
  }
};
var EXTENSION_BRIDGE = new ExtensionBridge;

var HTTP_ORIGINS_ALLOWED = true;
var BROWSER_SUPPORTS_TLS_CHANNEL_ID = false;
var FACTORY_REGISTRY = (function() {
  var windowTimer = new WindowTimer();
  var xhrTextFetcher = new XhrTextFetcher();
  return new FactoryRegistry(
      new XhrAppIdCheckerFactory(xhrTextFetcher),
      new CryptoTokenApprovedOrigin(),
      new CountdownTimerFactory(windowTimer),
      new CryptoTokenOriginChecker(),
      // @mastahyeti
      // new UsbHelper(),
      new GenericRequestHelper(),
      windowTimer,
      xhrTextFetcher);
})();

FACTORY_REGISTRY.getRequestHelper().registerHandlerFactory('enroll_helper_request', function(request) {
  return {
    run: function(enrollCB) {
      var enrollChallenge = request.enrollChallenges[0];

      var keyHandle = Array.from(
        window.crypto.getRandomValues(new Uint8Array(KEY_HANDLE_SIZE))
      );

      var toSign = [0].concat(
        B64_decode(enrollChallenge.appIdHash),
        B64_decode(enrollChallenge.challengeHash),
        keyHandle
        // publicKey — this is appended in extension
      );

      var enrollParams = {
        appId: enrollChallenge.appIdHash,
        toSign: JSON.stringify(toSign)
      };

      EXTENSION_BRIDGE.queue(enrollParams, function(data) {
        var responseData = [5].concat(
            UTIL_StringToBytes(data['publicKey']),
            KEY_HANDLE_SIZE,
            keyHandle,
            UTIL_StringToBytes(data['certificate']),
            UTIL_StringToBytes(data['signature'])
        );

        enrollCB({version: U2F_VERSION, enrollData: B64_encode(responseData)});
      });
    },
    close: function(){}
}});

FACTORY_REGISTRY.getRequestHelper().registerHandlerFactory('sign_helper_request', function(request) {
  return {
    run: function(signCB) {
      console.log('sign_helper_request.run')
      console.log(request);
    },
    close: function(){}
  };
});

function doEnrollRequest(){
  var challenge = window.crypto.getRandomValues(new Uint8Array(CHALLENGE_SIZE));

  var request = {
      type: MessageTypes.U2F_REGISTER_REQUEST,
      appId: window.location.origin,
      registerRequests: [{
        version: U2F_VERSION,
        challenge: B64_encode(challenge)
      }],
      registeredKeys: [],
      timeoutSeconds: 300000,
      requestId: 1,
  }

  var sender = {
    url: window.location.href
  }

  handleWebPageRequest(request, sender, function(response){
    console.log("enroll responseCallback");
    console.log(response);
  });
}

function doSignRequest(){
  var challenge = window.crypto.getRandomValues(new Uint8Array(CHALLENGE_SIZE));

  var request = {
      type: MessageTypes.U2F_SIGN_REQUEST,
      appId: window.location.origin,
      challenge: B64_encode(challenge),
      registeredKeys: [{version: U2F_VERSION, keyHandle: 'lol'}],
      timeoutSeconds: 300000,
      requestId: 1,
  }

  var sender = {
    url: window.location.href
  }

  handleWebPageRequest(request, sender, function(response){
    console.log("sign responseCallback");
    console.log(response);
  });
}

var ExtensionPreprocessingJS = EXTENSION_BRIDGE;
