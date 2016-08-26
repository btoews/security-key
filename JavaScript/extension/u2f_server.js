// Copyright (c) 2016 GitHub, inc.

var u2fServer = function() {
  this.receive('request').then(this.handleRequest.bind(this));

  this.pingPong();
};

u2fServer.prototype = pingerPonger;

u2fServer.prototype.handleRequest = function(req) {
  var type = req.type;
  var appId = req.appId;
  var challenge = req.challenge;
  var registeredKeys = req.registeredKeys;
  var registerRequests = req.registerRequests;

  this.timer = new Timer(30);

  this.validAppId(appId).then(function(valid) {
    if(!valid) {
      console.log('error - bad appId');
      this.send('response', {'errorCode': 2});
      return;
    }

    switch (type) {
      case 'register':
        this.handleRegisterRequest(appId, registerRequests);
        break;
      case 'sign':
        this.handleSignRequest(appId, challenge, registeredKeys);
        break;
      default:
        console.log('error - unknown request type');
        this.send('response', {'errorCode': 2});
    }
  }.bind(this)).catch(function(err) {
    console.log('error checking appId');
    console.log(err);
    this.send('response', {'errorCode': 2});
  }.bind(this));
}

u2fServer.prototype.validAppId = function(appId) {
  var textFetcher = new XhrTextFetcher();
  var xhrAppIdCheckerFactory = new XhrAppIdCheckerFactory(textFetcher);
  var appIdChecker = xhrAppIdCheckerFactory.create();
  return appIdChecker.checkAppIds(
    this.timer,
    window.location.origin,
    [appId],
    true // allow-http
  );
};

u2fServer.prototype.handleSignRequest = function(appId, challenge, registeredKeys) {
  var i;
  for(i = 0; i < registeredKeys.length; i++) {
    var registeredKey = registeredKeys[i];
    var keyHandle = B64_decode(registeredKey.keyHandle);

    if (validKeyHandleForAppId(keyHandle, appId)) {
      var signRequest = new SignRequest(
        extensionBridge,
        appId,
        challenge,
        keyHandle
      );

      return signRequest.response().then(function(resp) {
        this.send('response', resp);
      }.bind(this));
    }
  }

  console.log('error - no valid keyIds for appId');
  this.send('response', {'errorCode': 2});
};

u2fServer.prototype.handleRegisterRequest = function(appId, registerRequests) {
  if (registerRequests.length != 1) {
    console.log('error - multiple registerRequests');
    return this.send('response', {'errorCode': 2});
  } else {
    var registerRequest = new RegistrationRequest(
      extensionBridge,
      appId,
      registerRequests[0].challenge
    );

    registerRequest.response().then(function(resp) {
      this.send('response', resp);
    }.bind(this));
  }
};
