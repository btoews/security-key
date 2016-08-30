// Copyright (c) 2016 GitHub, inc.

var pingerPonger = {
  pingPong: function() {
    this.whenReady_ = [];
    this.isReady_ = false;

    this.send('ping');
    this.receive('pong', this.isReady);

    this.receive('ping', function() {
      this.send('pong');
      this.isReady();
    });
  },

  receive: function(name, cb) {
    window.addEventListener('u2f-' + name, function(e) {
      cb.apply(this, e.detail);
    }.bind(this));
  },

  send: function(name) {
    var args = Array.from(arguments).slice(1);
    window.dispatchEvent(new CustomEvent('u2f-' + name, {detail: args}));
  },

  whenReady: function(cb) {
    if (this.isReady_) {
      cb.apply(this);
    } else {
      this.whenReady_.push(cb);
    }
  },

  isReady: function() {
    this.isReady_ = true;
    while(cb = this.whenReady_.shift()) {
      cb.apply(this);
    }
  }
};
