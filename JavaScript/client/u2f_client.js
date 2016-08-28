// Copyright (c) 2016 GitHub, inc.

var u2fClient = function() { this.pingPong(); };

u2fClient.prototype = pingerPonger;
u2fClient.prototype.register = pingerPonger.rpcSender('register');
u2fClient.prototype.sign = pingerPonger.rpcSender('sign');
