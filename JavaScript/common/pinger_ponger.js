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

  findOrMakeTransferElt: function() {
    this.transferElt = document.getElementById('u2f-transfer');
    if (!this.transferElt) {
      this.transferElt = document.createElement('span');
      this.transferElt.id = 'u2f-transfer';
      document.documentElement.appendChild(this.transferElt);
    }
  },

  receive: function(name) {
    return new Promise(function(resolve, reject) {
      this.transferElt.addEventListener(name, function() {
        console.log('pingerPonger receiving ' + name);
        resolve(JSON.parse(this.transferElt.dataset[name]));
      }.bind(this));
    }.bind(this));
  },

  send: function(name, value) {
    console.log('pingerPonger sending ' + name);
    this.transferElt.dataset[name] = JSON.stringify(value);
    this.transferElt.dispatchEvent(new Event(name));
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
