function SignRequest(signer, challenge, appId, keyHandle) {
  this.signer = signer;
  this.challenge = challenge;
  this.appId = appId;
  this.keyHandle = keyHandle;
}

SignRequest.USER_PRESENCE = 1;
SignRequest.COUNTER = [0, 0, 0, 0];

SignRequest.prototype.response = function() {
  console.log('SignRequest.prototype.response');
  return new Promise(function() {
    this.signatureDataBytes().then(function(sigData) {
      var response = {
        'clientData': B64_encode(UTIL_StringToBytes(this.clientDataJson())),
        'keyHandle': B64_encode(UTIL_StringToBytes(this.keyHandle)),
        'signatureData': B64_encode(sigData)
      };

      resolve(JSON.stringify(response));
    });
  }.bind(this));
};

SignRequest.prototype.signatureDataBytes = function() {
  console.log('SignRequest.prototype.signatureDataBytes');
  return new Promise(function(resolve, reject) {
    this.signatureBytes().then(function(sig) {
      var bytes = [].concat(
        SignRequest.USER_PRESENCE,
        SignRequest.COUNTER,
        sig
      );

      resolve(bytes);
    });
  }.bind(this));
};

SignRequest.prototype.signatureBytes = function() {
  console.log('SignRequest.prototype.signatureBytes');
  return new Promise(function (resolve, reject) {
    var toSign = [].concat(
      this.applicationParameter(),
      SignRequest.USER_PRESENCE,
      SignRequest.COUNTER,
      this.challengeParameter()
    );

    this.signer.sign(this.appId, toSign).then(function(sig) {
      resolve(UTIL_StringToBytes(sig));
    });
  }.bind(this));
};

SignRequest.prototype.clientDataJson = function() {
  console.log('SignRequest.prototype.clientDataJson');
  clientData = new ClientData(
    ClientData.AUTHENTICATION_TYP,
    this.challenge,
    this.appId
  );

  return clientData.json();
};

SignRequest.prototype.applicationParameter = function() {
  d = new SHA256();
  d.update(UTIL_StringToBytes(this.appId));
  return d.digest();
};

SignRequest.prototype.challengeParameter = function() {
  d = new SHA256();
  d.update(UTIL_StringToBytes(this.clientDataJson()));
  return d.digest();
};
