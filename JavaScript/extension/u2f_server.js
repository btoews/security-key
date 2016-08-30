// Copyright (c) 2016 GitHub, inc.

var u2fServer = function(extension) {
  this.extension = extension;
  this.rpcResponder('register', this.handleRegisterRequest);
  this.rpcResponder('sign', this.handleSignRequest);
  this.pingPong();
};

u2fServer.prototype = pingerPonger;

u2fServer.prototype.rpcResponder = function(name, requestHandler) {
  var self = this;
  self.receive(name + '-request', function() {
    requestHandler.apply(this, arguments).then(function(resp) {
      self.send(name + '-response', resp);
    }).catch(function(e) {
      console.log(name, 'error', e);
      self.send(name + '-response', {'errorCode': 2});
    });
  });
};

u2fServer.prototype.handleSignRequest = function(appId, challenge, registeredKeys) {
  var self = this;
  return validAppId(appId).then(function() {
    while (registeredKey = registeredKeys.shift()) {
      var keyHandle = B64_decode(registeredKey.keyHandle);

      if (validKeyHandleForAppId(keyHandle, appId)) {
        var signRequest = new SignRequest(
          self.extension,
          appId,
          challenge,
          keyHandle
        );

        return signRequest.response();
      }
    }

    return Promise.reject('no known key handles');
  });
};

u2fServer.prototype.handleRegisterRequest = function(appId, registerRequests, registeredKeys) {
  var self = this;
  return validAppId(appId).then(function() {
    if (registerRequests.length != 1) {
      return Promise.reject('too many registerRequests');
    }

    var registerRequest = new RegistrationRequest(
      self.extension,
      appId,
      registerRequests[0].challenge
    );

    return registerRequest.response();
  });
};
