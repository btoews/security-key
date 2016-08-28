(function(exports, global) {
    var pingerPonger = {
        pingPong: function() {
            var self = this;
            self.whenReady_ = [];
            self.isReady_ = false;
            self.send("ping");
            self.receive("pong").then(function() {
                self.isReady();
            });
            self.receive("ping").then(function() {
                self.send("pong");
                self.isReady();
            });
        },
        receive: function(name) {
            var self = this;
            return new Promise(function(resolve, reject) {
                window.addEventListener("u2f-" + name, function(e) {
                    console.log("receiving " + name + ": " + JSON.stringify(e.detail));
                    resolve(e.detail);
                });
            });
        },
        send: function(name) {
            var args = Array.from(arguments).slice(1);
            console.log("sending " + name + ": " + JSON.stringify(args));
            window.dispatchEvent(new CustomEvent("u2f-" + name, {
                detail: args
            }));
        },
        whenReady: function() {
            var self = this;
            if (this.isReady_) {
                return Promise.resolve();
            } else {
                return new Promise(function(resolve, reject) {
                    self.whenReady_.push(resolve);
                });
            }
        },
        isReady: function() {
            this.isReady_ = true;
            var i;
            for (i = 0; i < this.whenReady_.length; i++) {
                this.whenReady_[i]();
            }
        },
        rpcReceive: function(name, cb) {
            var self = this;
            self.receive(name + "-request").then(function(args) {
                cb.apply(self, args);
            });
        }
    };
    pingerPonger.rpcSender = function(name) {
        return function() {
            var self = this;
            var args = Array.from(arguments);
            args.unshift(name + "-request");
            var responseHandler = args.pop();
            self.receive(name + "-response").then(function(args) {
                responseHandler.apply(self, args);
            });
            self.whenReady().then(function() {
                self.send.apply(self, args);
            });
        };
    };
    var u2fClient = function() {
        this.pingPong();
    };
    u2fClient.prototype = pingerPonger;
    u2fClient.prototype.register = pingerPonger.rpcSender("register");
    u2fClient.prototype.sign = pingerPonger.rpcSender("sign");
    if (!global.u2f && !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)) {
        global.u2f = new u2fClient();
    }
    global[""] = exports;
})({}, function() {
    return this;
}());
