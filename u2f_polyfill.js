(function(global) {
    var pingerPonger = {
        pingPong: function() {
            this.whenReady_ = [];
            this.isReady_ = false;
            this.send("ping");
            this.receive("pong", this.isReady);
            this.receive("ping", function() {
                this.send("pong");
                this.isReady();
            });
        },
        receive: function(name, cb) {
            window.addEventListener("u2f-" + name, function(e) {
                cb.apply(this, e.detail);
            }.bind(this));
        },
        send: function(name) {
            var args = Array.from(arguments).slice(1);
            window.dispatchEvent(new CustomEvent("u2f-" + name, {
                detail: args
            }));
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
            while (cb = this.whenReady_.shift()) {
                cb.apply(this);
            }
        }
    };
    var u2fClient = function() {
        this.rpcRequester("register");
        this.rpcRequester("sign");
        this.pingPong();
    };
    u2fClient.prototype = pingerPonger;
    u2fClient.prototype.rpcRequester = function(name) {
        this[name] = function() {
            var args = Array.from(arguments);
            args.unshift(name + "-request");
            var cb = args.pop();
            this.receive(name + "-response", cb);
            this.whenReady(function() {
                this.send.apply(this, args);
            });
        };
    };
    if (!global.u2f && !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)) {
        global.u2f = new u2fClient();
    }
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {});
