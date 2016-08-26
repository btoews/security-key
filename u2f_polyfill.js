(function(exports, global) {
    var pingerPonger = {
        pingPong: function() {
            this.whenReady_ = [];
            this.isReady_ = false;
            this.send("u2f-ping", 1);
            this.receive("u2f-pong").then(function() {
                this.isReady();
            }.bind(this));
            this.receive("u2f-ping").then(function() {
                this.send("u2f-pong", 1);
                this.isReady();
            }.bind(this));
        },
        receive: function(name) {
            return new Promise(function(resolve, reject) {
                window.addEventListener(name, function(e) {
                    console.log("receiving " + name);
                    resolve(e.detail);
                });
            });
        },
        send: function(name, value) {
            console.log("sending " + name + ": " + JSON.stringify(value));
            window.dispatchEvent(new CustomEvent(name, {
                detail: value
            }));
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
            for (i = 0; i < this.whenReady_.length; i++) {
                this.whenReady_[i]();
            }
        }
    };
    var u2fClient = function() {
        this.pingPong();
    };
    u2fClient.prototype = pingerPonger;
    u2fClient.prototype.register = function(appId, registerRequests, registeredKeys, responseHandler) {
        this.whenReady().then(function() {
            this.receive("u2f-response").then(responseHandler);
            this.send("u2f-request", {
                type: "register",
                appId: appId,
                registerRequests: registerRequests,
                registeredKeys: registeredKeys
            });
        }.bind(this));
    };
    u2fClient.prototype.sign = function(appId, challenge, registeredKeys, responseHandler) {
        this.whenReady().then(function() {
            this.receive("u2f-response").then(responseHandler);
            this.send("u2f-request", {
                type: "sign",
                appId: appId,
                challenge: challenge,
                registeredKeys: registeredKeys
            });
        }.bind(this));
    };
    if (!global.u2f && !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)) {
        global.u2f = new u2fClient();
    }
    global[""] = exports;
})({}, function() {
    return this;
}());
