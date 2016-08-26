function RegistrationRequest(enroller, appId, challenge) {
  this.enroller = enroller;
  this.appId = appId;
  this.challenge = challenge;
  this.keyHandle = keyHandleFromAppId(appId);
}

RegistrationRequest.Version = 'U2F_V2';

RegistrationRequest.prototype.response = function() {
  return this.registrationDataBytes().then(function(regData) {
    var response = {
      'version': RegistrationRequest.Version,
      'registrationData': B64_encode(regData),
      'clientData': B64_encode(UTIL_StringToBytes(this.clientData().json()))
    };

    return Promise.resolve(response);
  }.bind(this));
};

RegistrationRequest.prototype.registrationDataBytes = function() {
  return this.extensionResponse().then(function(extResp) {
    var bytes = [5].concat(
      UTIL_StringToBytes(extResp.publicKey),
      this.keyHandle.length,
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

  var b64KeyHandle = B64_encode(this.keyHandle);
  return this.enroller.register(b64KeyHandle, toSign).then(function(resp) {
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
