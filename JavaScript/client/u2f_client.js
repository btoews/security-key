// Copyright (c) 2016 GitHub, inc.

var u2fClient = function() {
  this.rpcRequester('register');
  this.rpcRequester('sign');
  this.pingPong();
};

u2fClient.prototype = pingerPonger;

u2fClient.prototype.rpcRequester = function(name) {
  this[name] = function() {
    var args = Array.from(arguments);
    args.unshift(name + '-request');

    var cb = args.pop();
    this.receive(name + '-response', cb);

    this.whenReady(function() {
      this.send.apply(this, args);
    });
  };
};
