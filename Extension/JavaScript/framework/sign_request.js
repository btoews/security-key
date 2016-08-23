function SignRequest(signer, challenge, appId, keyHandle) {
  this.signer = signer;
  this.challenge = challenge;
  this.appId = appId;
  this.keyHandle = keyHandle;
}

SignRequest.USER_PRESENCE = 1;
SignRequest.COUNTER = [0, 0, 0, 0];

SignRequest.prototype.response = function() {
  return new Promise(function() {
    this.signatureDataBytes().then(function(sigData) {
      var response = {
        'clientData': B64_encode(UTIL_StringToBytes(this.clientDataJson())),
        'keyHandle': B64_encode(UTIL_StringToBytes(this.keyHandle)),
        'signatureData': B64_encode(sigData)
      };

      resolve(JSON.stringify(response));
    });
  });
};

SignRequest.prototype.signatureDataBytes = function() {
  return new Promise(function(resolve, reject) {
    this.signatureBytes().then(function(sig) {
      var bytes = [].concat(
        SignRequest.USER_PRESENCE,
        SignRequest.COUNTER,
        sig
      );

      resolve(bytes);
    });
  });
};

SignRequest.prototype.signatureBytes = function() {
  return new Promise(function (resolve, reject) {
    var toSign = [].concat(
      this.applicationParameter,
      SignRequest.USER_PRESENCE,
      SignRequest.COUNTER,
      this.challengeParamter
    );

    this.signer.sign(toSign).then(function(sig) {
      resolve(UTIL_StringToBytes(sig));
    });
  });
};

SignRequest.prototype.clientDataJson = function() {
  clientData = new ClientData(
    ClientData.AUTHENTICATION_TYP,
    this.challenge,
    this.appId
  );

  return clientData.json();
}
