// Copyright (c) 2016 GitHub, inc.

var pingerPonger = {
  pingPong: function() {
    this.whenReady_ = [];
    this.isReady_ = false;

    this.send('ping', 1);

    this.receive('pong').then(function() {
      this.isReady();
    }.bind(this));

    this.receive('ping').then(function() {
      this.send('pong', 1);
      this.isReady();
    }.bind(this));
  },

  receive: function(name) {
    return new Promise(function(resolve, reject) {
      window.addEventListener('u2f-' + name, function(e) {
        console.log('receiving ' + name);
        resolve(e.detail);
      });
    });
  },

  send: function(name, value) {
    console.log('sending ' + name + ': ' + JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('u2f-' + name, {detail: value}));
  },

  whenReady: function() {
    if (this.isReady_) {
      return Promise.resolve();
    } else {
      return new Promise(function(resolve, reject) {
        this.whenReady_.push(resolve);
      }.bind(this));
    }
  },

  isReady: function() {
    this.isReady_ = true;
    var i;
    for(i = 0; i < this.whenReady_.length; i++) {
      this.whenReady_[i]();
    }
  }
};
