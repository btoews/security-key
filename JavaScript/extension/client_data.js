// Copyright (c) 2016 GitHub, inc.

function ClientData(typ, challenge, origin) {
  this.typ = typ;
  this.challenge = challenge;
  this.origin = origin;
}

ClientData.AUTHENTICATION_TYP = 'navigator.id.getAssertion';
ClientData.REGISTRATION_TYP   = 'navigator.id.finishEnrollment';

ClientData.prototype.json = function() {
  return JSON.stringify({
    challenge: this.challenge,
    origin: this.origin,
    typ: this.typ
  });
};
