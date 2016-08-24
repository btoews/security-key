// signer    - Function
// challenge - String
// appId     - String
// keyHandle - String
function SignRequest(signer, challenge, appId, keyHandle) {
  this.signer = signer;
  this.challenge = challenge;
  this.appId = appId;
  this.keyHandle = keyHandle;
}

SignRequest.USER_PRESENCE = 1;
SignRequest.COUNTER = [0, 0, 0, 0];

SignRequest.prototype.response = function() {
  var self = this;

  return self.signatureDataBytes().then(function(sigData) {
    var response = {
      'clientData': B64_encode(UTIL_StringToBytes(self.clientDataJson())),
      'keyHandle': B64_encode(UTIL_StringToBytes(self.keyHandle)),
      'signatureData': B64_encode(sigData)
    };

    return Promise.resolve(JSON.stringify(response));
  });

};

SignRequest.prototype.signatureDataBytes = function() {
  return this.signatureBytes().then(function(sig) {
    var bytes = [].concat(
      SignRequest.USER_PRESENCE,
      SignRequest.COUNTER,
      sig
    );

    return Promise.resolve(bytes);
  });
};

SignRequest.prototype.signatureBytes = function() {
  var toSign = [].concat(
    this.applicationParameter(),
    SignRequest.USER_PRESENCE,
    SignRequest.COUNTER,
    this.challengeParameter()
  );

  var appIdHash = B64_encode(this.applicationParameter());
  return this.signer.sign(appIdHash, toSign).then(function(sig) {
    return Promise.resolve(UTIL_StringToBytes(sig));
  });
};

SignRequest.prototype.clientDataJson = function() {
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
