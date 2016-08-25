function Timer(seconds) {
  this._expired = false;
  setTimeout(function(){
    this._expired = true;
  }.bind(this), seconds * 1000);
}

Timer.prototype.expired = function() {
  return this._expired;
}
