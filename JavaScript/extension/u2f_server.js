// Copyright (c) 2016 GitHub, inc.

var u2fServer = function() {
  this.rpcReceive('register', this.handleRegisterRequest);
  this.rpcReceive('sign', this.handleSignRequest);
  this.pingPong();
};

u2fServer.prototype = pingerPonger;

u2fServer.prototype.validAppId = function(appId) {
  var self = this;
  var timer = new Timer(30);
  var textFetcher = new XhrTextFetcher();
  var xhrAppIdCheckerFactory = new XhrAppIdCheckerFactory(textFetcher);
  var appIdChecker = xhrAppIdCheckerFactory.create();

  return appIdChecker.checkAppIds(
    timer,
    window.location.origin,
    [appId],
    true // allow-http
  ).then(function(valid) {
    if(valid) {
      return Promise.resolve();
    } else {
      return Promise.reject();
    }
  });
};

u2fServer.prototype.handleSignRequest = function(appId, challenge, registeredKeys) {
  var self = this;
  self.validAppId(appId).then(function() {
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

        signRequest.response().then(function(resp) {
          self.send('sign-response', resp);
        });

        return;
      }
    }

    self.send('sign-response', {'errorCode': 2});
  }).catch(function() {
    self.send('sign-response', {'errorCode': 2});
  });
};

u2fServer.prototype.handleRegisterRequest = function(appId, registerRequests, registeredKeys) {
  var self = this;
  self.validAppId(appId).then(function() {
    if (registerRequests.length != 1) {
      console.log('error - too many registerRequests');
      return self.send('register-response', {'errorCode': 2});
    }

    var registerRequest = new RegistrationRequest(
      extensionBridge,
      appId,
      registerRequests[0].challenge
    );

    registerRequest.response().then(function(resp) {
      self.send('register-response', resp);
    });
  }).catch(function(e) {
    console.log('error - invalid appId');
    console.log(e);
    self.send('register-response', {'errorCode': 2});
  });
};
