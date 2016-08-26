// signer    - Function
// appId     - String
// challenge - String
// keyHandle - Bytes
function SignRequest(signer, appId, challenge, keyHandle) {
  this.signer = signer;
  this.challenge = challenge;
  this.appId = appId;
  this.keyHandle = keyHandle;
}

SignRequest.USER_PRESENCE = 1;
SignRequest.COUNTER = [0, 0, 0, 0];

SignRequest.prototype.response = function() {
  if(!validKeyHandleForAppId(this.keyHandle, this.appId)) {
      console.log('keyHandle appId mismatch');
      return Promise.resolve({'errorCode': 2});
  }

  return this.signatureDataBytes().then(function(sigData) {
    var response = {
      'clientData': B64_encode(UTIL_StringToBytes(this.clientDataJson())),
      'keyHandle': B64_encode(this.keyHandle),
      'signatureData': B64_encode(sigData)
    };

    return Promise.resolve(response);
  }.bind(this));
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

  var b64KeyHandle = B64_encode(this.keyHandle);
  return this.signer.sign(b64KeyHandle, toSign).then(function(sig) {
    return Promise.resolve(UTIL_StringToBytes(sig));
  });
};

SignRequest.prototype.clientDataJson = function() {
  var clientData = new ClientData(
    ClientData.AUTHENTICATION_TYP,
    this.challenge,
    this.appId
  );

  return clientData.json();
};

SignRequest.prototype.applicationParameter = function() {
  var d = new SHA256();
  d.update(UTIL_StringToBytes(this.appId));
  return d.digest();
};

SignRequest.prototype.challengeParameter = function() {
  var d = new SHA256();
  d.update(UTIL_StringToBytes(this.clientDataJson()));
  return d.digest();
};
