function RegistrationRequest(enroller, appId, challenge) {
  this.enroller = enroller;
  this.appId = appId;
  this.challenge = challenge;
  this.keyHandle = Array.from(window.crypto.getRandomValues(
    new Uint8Array(RegistrationRequest.KeyHandleSize)
  ));
}

RegistrationRequest.KeyHandleSize = 32;
RegistrationRequest.Version = 'U2F_V2';

RegistrationRequest.prototype.response = function() {
  return this.registrationDataBytes().then(function(regData) {
    var response = {
      'version': RegistrationRequest.Version,
      'registrationData': B64_encode(regData),
      'clientData': B64_encode(UTIL_StringToBytes(this.clientData().json()))
    };

    return Promise.resolve(JSON.stringify(response));
  }.bind(this));
};

RegistrationRequest.prototype.registrationDataBytes = function() {
  return this.extensionResponse().then(function(extResp) {
    var bytes = [5].concat(
      UTIL_StringToBytes(extResp.publicKey),
      RegistrationRequest.KeyHandleSize,
      this.keyHandle,
      UTIL_StringToBytes(extResp.certificate),
      UTIL_StringToBytes(extResp.signature)
    );

    return Promise.resolve(bytes);
  }.bind(this));
};

RegistrationRequest.prototype.extensionResponse = function() {
  var toSign = [0].concat(
    this.applicationParameter(),
    this.challengeParameter(),
    this.keyHandle
    // publicKey appended by extension
  );

  var appIdHash = B64_encode(this.applicationParameter());
  return this.enroller.register(appIdHash, toSign).then(function(resp) {
    return Promise.resolve(resp);
  });
};

RegistrationRequest.prototype.applicationParameter = function() {
  var d = new SHA256();
  d.update(UTIL_StringToBytes(this.appId));
  return d.digest();
};

RegistrationRequest.prototype.challengeParameter = function() {
  var d = new SHA256();
  d.update(UTIL_StringToBytes(this.clientData().json()));
  return d.digest();
};

RegistrationRequest.prototype.clientData = function() {
  return new ClientData(
    ClientData.REGISTRATION_TYP,
    this.challenge,
    this.appId
  );
};
