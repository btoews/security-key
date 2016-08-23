function ClientData(typ, challenge, origin) {
  this.type = typ;
  this.challenge = challenge;
  this.origin = origin;
}

ClientData.prototype.json = function() {
  return JSON.stringify({
    challenge: this.challenge,
    origin: this.origin,
    typ: this.typ
  });
};

ClientData.AUTHENTICATION_TYP = 'navigator.id.getAssertion';
ClientData.REGISTRATION_TYP   = 'navigator.id.finishEnrollment';
