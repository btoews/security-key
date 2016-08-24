// var transferServer = new TransferServer();
// var ExtensionPreprocessingJS = transferServer;

var extensionBridge = new ExtensionBridge();

var challengeSize = 32;
var keyHandleSize = 32;
var transferClient;

function u2fAuthenticate() {
  console.log('3');
  var challenge = UTIL_BytesToString(window.crypto.getRandomValues(new Uint8Array(challengeSize)));
  var keyHandle = UTIL_BytesToString(window.crypto.getRandomValues(new Uint8Array(keyHandleSize)));
  var appId = window.location.origin;

  var signRequest = new SignRequest(
    extensionBridge,
    appId,
    challenge,
    keyHandle
  );

  signRequest.response().then(function(res) {
    console.log('sign response');
    console.log(res);
  }, function(err) {
    console.log('sign error');
    console.log(err);
  });
}

function u2fRegister() {
  var appId = window.location.origin;

  var challenge = B64_encode(
    window.crypto.getRandomValues(new Uint8Array(challengeSize))
  );

  var registerRequest = new RegistrationRequest(
    extensionBridge,
    appId,
    challenge
  );

  registerRequest.response().then(function(resp) {
    console.log('registration response');
    console.log(resp);
  }, function(err) {
    console.log('registration error');
    console.log(err);
  });
}

u2fRegister();
// u2fAuthenticate();

var ExtensionPreprocessingJS = extensionBridge;
