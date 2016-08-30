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

function validAppId(appId) {
    var timer = new Timer(30);
    var textFetcher = new XhrTextFetcher();
    var xhrAppIdCheckerFactory = new XhrAppIdCheckerFactory(textFetcher);
    var appIdChecker = xhrAppIdCheckerFactory.create();
    return appIdChecker.checkAppIds(timer, window.location.origin, [ appId ], true).then(function(valid) {
        if (valid) {
            return Promise.resolve();
        } else {
            return Promise.reject("invalid app id for origin");
        }
    });
}

"use strict";

function getOriginFromUrl(url) {
    var re = new RegExp("^(https?://)[^/]*/?");
    var originarray = re.exec(url);
    if (originarray == null) return originarray;
    var origin = originarray[0];
    while (origin.charAt(origin.length - 1) == "/") {
        origin = origin.substring(0, origin.length - 1);
    }
    if (origin == "http:" || origin == "https:") return null;
    return origin;
}

function getOriginsFromJson(text) {
    try {
        var urls, i;
        var appIdData = JSON.parse(text);
        if (Array.isArray(appIdData)) {
            urls = appIdData;
        } else {
            var trustedFacets = appIdData["trustedFacets"];
            if (trustedFacets) {
                var versionBlock;
                for (i = 0; versionBlock = trustedFacets[i]; i++) {
                    if (versionBlock["version"] && versionBlock["version"]["major"] == 1 && versionBlock["version"]["minor"] == 0) {
                        urls = versionBlock["ids"];
                        break;
                    }
                }
            }
            if (typeof urls == "undefined") {
                throw Error("Could not find trustedFacets for version 1.0");
            }
        }
        var origins = {};
        var url;
        for (i = 0; url = urls[i]; i++) {
            var origin = getOriginFromUrl(url);
            if (origin) {
                origins[origin] = origin;
            }
        }
        return Object.keys(origins);
    } catch (e) {
        console.error(UTIL_fmt("could not parse " + text));
        return [];
    }
}

function getDistinctAppIds(signChallenges) {
    if (!signChallenges) {
        return [];
    }
    var appIds = {};
    for (var i = 0, request; request = signChallenges[i]; i++) {
        var appId = request["appId"];
        if (appId) {
            appIds[appId] = appId;
        }
    }
    return Object.keys(appIds);
}

function AppIdChecker() {}

AppIdChecker.prototype.checkAppIds = function(timer, origin, appIds, allowHttp, opt_logMsgUrl) {};

function AppIdCheckerFactory() {}

AppIdCheckerFactory.prototype.create = function() {};

function XhrAppIdChecker(fetcher) {
    this.fetcher_ = fetcher;
}

XhrAppIdChecker.prototype.checkAppIds = function(timer, origin, appIds, allowHttp, opt_logMsgUrl) {
    if (this.timer_) {
        return Promise.resolve(false);
    }
    this.timer_ = timer;
    this.origin_ = origin;
    var appIdsMap = {};
    if (appIds) {
        for (var i = 0; i < appIds.length; i++) {
            appIdsMap[appIds[i]] = appIds[i];
        }
    }
    this.distinctAppIds_ = Object.keys(appIdsMap);
    this.allowHttp_ = allowHttp;
    this.logMsgUrl_ = opt_logMsgUrl;
    if (!this.distinctAppIds_.length) return Promise.resolve(false);
    if (this.allAppIdsEqualOrigin_()) {
        return Promise.resolve(true);
    } else {
        var self = this;
        var appIdChecks = self.distinctAppIds_.map(self.checkAppId_.bind(self));
        return Promise.all(appIdChecks).then(function(results) {
            return results.every(function(result) {
                return result;
            });
        });
    }
};

XhrAppIdChecker.prototype.checkAppId_ = function(appId) {
    if (appId == this.origin_) {
        return Promise.resolve(true);
    }
    var p = this.fetchAllowedOriginsForAppId_(appId);
    var self = this;
    return p.then(function(allowedOrigins) {
        if (allowedOrigins.indexOf(self.origin_) == -1) {
            console.warn(UTIL_fmt("Origin " + self.origin_ + " not allowed by app id " + appId));
            return false;
        }
        return true;
    });
};

XhrAppIdChecker.prototype.allAppIdsEqualOrigin_ = function() {
    var self = this;
    return this.distinctAppIds_.every(function(appId) {
        return appId == self.origin_;
    });
};

XhrAppIdChecker.prototype.fetchAllowedOriginsForAppId_ = function(appId) {
    if (!appId) {
        return Promise.resolve([]);
    }
    if (appId.indexOf("http://") == 0 && !this.allowHttp_) {
        console.log(UTIL_fmt("http app ids disallowed, " + appId + " requested"));
        return Promise.resolve([]);
    }
    var origin = getOriginFromUrl(appId);
    if (!origin) {
        return Promise.resolve([]);
    }
    var p = this.fetcher_.fetch(appId);
    var self = this;
    return p.then(getOriginsFromJson, function(rc_) {
        var rc = rc_;
        console.log(UTIL_fmt("fetching " + appId + " failed: " + rc));
        if (!(rc >= 400 && rc < 500) && !self.timer_.expired()) {
            return self.fetchAllowedOriginsForAppId_(appId);
        }
        return [];
    });
};

function XhrAppIdCheckerFactory(fetcher) {
    this.fetcher_ = fetcher;
}

XhrAppIdCheckerFactory.prototype.create = function() {
    return new XhrAppIdChecker(this.fetcher_);
};

function B64_encode(bytes, opt_length) {
    if (!opt_length) opt_length = bytes.length;
    var b64out = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    var result = "";
    var shift = 0;
    var accu = 0;
    var inputIndex = 0;
    while (opt_length--) {
        accu <<= 8;
        accu |= bytes[inputIndex++];
        shift += 8;
        while (shift >= 6) {
            var i = accu >> shift - 6 & 63;
            result += b64out.charAt(i);
            shift -= 6;
        }
    }
    if (shift) {
        accu <<= 8;
        shift += 8;
        var i = accu >> shift - 6 & 63;
        result += b64out.charAt(i);
    }
    return result;
}

function base64_encode(bytes, opt_length) {
    if (!opt_length) opt_length = bytes.length;
    var b64out = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var result = "";
    var shift = 0;
    var accu = 0;
    var inputIndex = 0;
    while (opt_length--) {
        accu <<= 8;
        accu |= bytes[inputIndex++];
        shift += 8;
        while (shift >= 6) {
            var i = accu >> shift - 6 & 63;
            result += b64out.charAt(i);
            shift -= 6;
        }
    }
    if (shift) {
        accu <<= 8;
        shift += 8;
        var i = accu >> shift - 6 & 63;
        result += b64out.charAt(i);
    }
    while (result.length % 4) result += "=";
    return result;
}

var B64_inmap = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 0, 0, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 0, 0, 0, 0, 64, 0, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 0, 0, 0, 0, 0 ];

function B64_decode(string) {
    var bytes = [];
    var accu = 0;
    var shift = 0;
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);
        if (c < 32 || c > 127 || !B64_inmap[c - 32]) return [];
        accu <<= 6;
        accu |= B64_inmap[c - 32] - 1;
        shift += 6;
        if (shift >= 8) {
            bytes.push(accu >> shift - 8 & 255);
            shift -= 8;
        }
    }
    return bytes;
}

function SHA256() {
    this._buf = new Array(64);
    this._W = new Array(64);
    this._pad = new Array(64);
    this._k = [ 1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298 ];
    this._pad[0] = 128;
    for (var i = 1; i < 64; ++i) this._pad[i] = 0;
    this.reset();
}

SHA256.prototype.reset = function() {
    this._chain = [ 1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225 ];
    this._inbuf = 0;
    this._total = 0;
};

SHA256.prototype._compress = function(buf) {
    var W = this._W;
    var k = this._k;
    function _rotr(w, r) {
        return w << 32 - r | w >>> r;
    }
    for (var i = 0; i < 64; i += 4) {
        var w = buf[i] << 24 | buf[i + 1] << 16 | buf[i + 2] << 8 | buf[i + 3];
        W[i / 4] = w;
    }
    for (var i = 16; i < 64; ++i) {
        var s0 = _rotr(W[i - 15], 7) ^ _rotr(W[i - 15], 18) ^ W[i - 15] >>> 3;
        var s1 = _rotr(W[i - 2], 17) ^ _rotr(W[i - 2], 19) ^ W[i - 2] >>> 10;
        W[i] = W[i - 16] + s0 + W[i - 7] + s1 & 4294967295;
    }
    var A = this._chain[0];
    var B = this._chain[1];
    var C = this._chain[2];
    var D = this._chain[3];
    var E = this._chain[4];
    var F = this._chain[5];
    var G = this._chain[6];
    var H = this._chain[7];
    for (var i = 0; i < 64; ++i) {
        var S0 = _rotr(A, 2) ^ _rotr(A, 13) ^ _rotr(A, 22);
        var maj = A & B ^ A & C ^ B & C;
        var t2 = S0 + maj & 4294967295;
        var S1 = _rotr(E, 6) ^ _rotr(E, 11) ^ _rotr(E, 25);
        var ch = E & F ^ ~E & G;
        var t1 = H + S1 + ch + k[i] + W[i] & 4294967295;
        H = G;
        G = F;
        F = E;
        E = D + t1 & 4294967295;
        D = C;
        C = B;
        B = A;
        A = t1 + t2 & 4294967295;
    }
    this._chain[0] += A;
    this._chain[1] += B;
    this._chain[2] += C;
    this._chain[3] += D;
    this._chain[4] += E;
    this._chain[5] += F;
    this._chain[6] += G;
    this._chain[7] += H;
};

SHA256.prototype.update = function(bytes, opt_length) {
    if (!opt_length) opt_length = bytes.length;
    this._total += opt_length;
    for (var n = 0; n < opt_length; ++n) {
        this._buf[this._inbuf++] = bytes[n];
        if (this._inbuf == 64) {
            this._compress(this._buf);
            this._inbuf = 0;
        }
    }
};

SHA256.prototype.updateRange = function(bytes, start, end) {
    this._total += end - start;
    for (var n = start; n < end; ++n) {
        this._buf[this._inbuf++] = bytes[n];
        if (this._inbuf == 64) {
            this._compress(this._buf);
            this._inbuf = 0;
        }
    }
};

SHA256.prototype.digest = function(var_args) {
    for (var i = 0; i < arguments.length; ++i) this.update(arguments[i]);
    var digest = new Array(32);
    var totalBits = this._total * 8;
    if (this._inbuf < 56) this.update(this._pad, 56 - this._inbuf); else this.update(this._pad, 64 - (this._inbuf - 56));
    for (var i = 63; i >= 56; --i) {
        this._buf[i] = totalBits & 255;
        totalBits >>>= 8;
    }
    this._compress(this._buf);
    var n = 0;
    for (var i = 0; i < 8; ++i) for (var j = 24; j >= 0; j -= 8) digest[n++] = this._chain[i] >> j & 255;
    return digest;
};

"use strict";

function TextFetcher() {}

TextFetcher.prototype.fetch = function(url, opt_method, opt_body) {};

function XhrTextFetcher() {}

XhrTextFetcher.prototype.fetch = function(url, opt_method, opt_body) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        var method = opt_method || "GET";
        xhr.open(method, url, true);
        xhr.onloadend = function() {
            if (xhr.status != 200) {
                reject(xhr.status);
                return;
            }
            resolve(xhr.responseText);
        };
        xhr.onerror = function() {
            reject(404);
        };
        if (opt_body) xhr.send(opt_body); else xhr.send();
    });
};

function UTIL_StringToBytes(s, bytes) {
    bytes = bytes || new Array(s.length);
    for (var i = 0; i < s.length; ++i) bytes[i] = s.charCodeAt(i);
    return bytes;
}

function UTIL_BytesToString(b) {
    return String.fromCharCode.apply(null, b);
}

function UTIL_BytesToHex(b) {
    if (!b) return "(null)";
    var hexchars = "0123456789ABCDEF";
    var hexrep = new Array(b.length * 2);
    for (var i = 0; i < b.length; ++i) {
        hexrep[i * 2 + 0] = hexchars.charAt(b[i] >> 4 & 15);
        hexrep[i * 2 + 1] = hexchars.charAt(b[i] & 15);
    }
    return hexrep.join("");
}

function UTIL_BytesToHexWithSeparator(b, sep) {
    var hexchars = "0123456789ABCDEF";
    var stride = 2 + (sep ? 1 : 0);
    var hexrep = new Array(b.length * stride);
    for (var i = 0; i < b.length; ++i) {
        if (sep) hexrep[i * stride + 0] = sep;
        hexrep[i * stride + stride - 2] = hexchars.charAt(b[i] >> 4 & 15);
        hexrep[i * stride + stride - 1] = hexchars.charAt(b[i] & 15);
    }
    return (sep ? hexrep.slice(1) : hexrep).join("");
}

function UTIL_HexToBytes(h) {
    var hexchars = "0123456789ABCDEFabcdef";
    var res = new Uint8Array(h.length / 2);
    for (var i = 0; i < h.length; i += 2) {
        if (hexchars.indexOf(h.substring(i, i + 1)) == -1) break;
        res[i / 2] = parseInt(h.substring(i, i + 2), 16);
    }
    return res;
}

function UTIL_HexToArray(h) {
    var hexchars = "0123456789ABCDEFabcdef";
    var res = new Array(h.length / 2);
    for (var i = 0; i < h.length; i += 2) {
        if (hexchars.indexOf(h.substring(i, i + 1)) == -1) break;
        res[i / 2] = parseInt(h.substring(i, i + 2), 16);
    }
    return res;
}

function UTIL_equalArrays(a, b) {
    if (!a || !b) return false;
    if (a.length != b.length) return false;
    var accu = 0;
    for (var i = 0; i < a.length; ++i) accu |= a[i] ^ b[i];
    return accu === 0;
}

function UTIL_ltArrays(a, b) {
    if (a.length < b.length) return true;
    if (a.length > b.length) return false;
    for (var i = 0; i < a.length; ++i) {
        if (a[i] < b[i]) return true;
        if (a[i] > b[i]) return false;
    }
    return false;
}

function UTIL_gtArrays(a, b) {
    return UTIL_ltArrays(b, a);
}

function UTIL_geArrays(a, b) {
    return !UTIL_ltArrays(a, b);
}

function UTIL_unionArrays(a, b) {
    var obj = {};
    for (var i = 0; i < a.length; i++) {
        obj[a[i]] = a[i];
    }
    for (var i = 0; i < b.length; i++) {
        obj[b[i]] = b[i];
    }
    var union = [];
    for (var k in obj) {
        union.push(obj[k]);
    }
    return union;
}

function UTIL_getRandom(a) {
    var tmp = new Array(a);
    var rnd = new Uint8Array(a);
    window.crypto.getRandomValues(rnd);
    for (var i = 0; i < a; ++i) tmp[i] = rnd[i] & 255;
    return tmp;
}

function UTIL_setFavicon(icon) {
    var faviconLink = document.createElement("link");
    faviconLink.rel = "Shortcut Icon";
    faviconLink.type = "image/x-icon";
    faviconLink.href = icon;
    var head = document.getElementsByTagName("head")[0];
    var links = head.getElementsByTagName("link");
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        if (link.type == faviconLink.type && link.rel == faviconLink.rel) {
            head.removeChild(link);
        }
    }
    head.appendChild(faviconLink);
}

function UTIL_clear(a) {
    if (a instanceof Array) {
        for (var i = 0; i < a.length; ++i) a[i] = 0;
    }
}

var UTIL_ASN_INT = 2;

var UTIL_ASN_SEQUENCE = 48;

function UTIL_Asn1SignatureToJson(a) {
    if (a.length < 6) return null;
    if (a[0] != UTIL_ASN_SEQUENCE) return null;
    var l = a[1] & 255;
    if (l & 128) return null;
    if (a.length != 2 + l) return null;
    function parseInt(off) {
        if (a[off] != UTIL_ASN_INT) return null;
        var l = a[off + 1] & 255;
        if (l & 128) return null;
        if (off + 2 + l > a.length) return null;
        return a.slice(off + 2, off + 2 + l);
    }
    var r = parseInt(2);
    if (!r) return null;
    var s = parseInt(2 + 2 + r.length);
    if (!s) return null;
    return {
        r: r,
        s: s
    };
}

function UTIL_JsonSignatureToAsn1(sig) {
    var rbytes = sig.r;
    var sbytes = sig.s;
    if (rbytes[0] & 128) rbytes.unshift(0);
    if (sbytes[0] & 128) sbytes.unshift(0);
    var len = 4 + rbytes.length + sbytes.length;
    var buf = new Uint8Array(2 + len);
    var i = 0;
    buf[i++] = UTIL_ASN_SEQUENCE;
    buf[i++] = len;
    buf[i++] = UTIL_ASN_INT;
    buf[i++] = rbytes.length;
    buf.set(rbytes, i);
    i += rbytes.length;
    buf[i++] = UTIL_ASN_INT;
    buf[i++] = sbytes.length;
    buf.set(sbytes, i);
    return buf;
}

function UTIL_prepend_zero(s, n) {
    if (s.length == n) return s;
    var l = s.length;
    for (var i = 0; i < n - l; ++i) {
        s = "0" + s;
    }
    return s;
}

function UTIL_time() {
    var d = new Date();
    var m = UTIL_prepend_zero((d.getMonth() + 1).toString(), 2);
    var t = UTIL_prepend_zero(d.getDate().toString(), 2);
    var H = UTIL_prepend_zero(d.getHours().toString(), 2);
    var M = UTIL_prepend_zero(d.getMinutes().toString(), 2);
    var S = UTIL_prepend_zero(d.getSeconds().toString(), 2);
    var L = UTIL_prepend_zero((d.getMilliseconds() * 1e3).toString(), 6);
    return m + t + " " + H + ":" + M + ":" + S + "." + L;
}

var UTIL_events = [];

var UTIL_max_events = 500;

function UTIL_fmt(s) {
    var line = UTIL_time() + ": " + s;
    if (UTIL_events.push(line) > UTIL_max_events) {
        UTIL_events.splice(0, UTIL_events.length - UTIL_max_events);
    }
    return line;
}

function ClientData(typ, challenge, origin) {
    this.typ = typ;
    this.challenge = challenge;
    this.origin = origin;
}

ClientData.AUTHENTICATION_TYP = "navigator.id.getAssertion";

ClientData.REGISTRATION_TYP = "navigator.id.finishEnrollment";

ClientData.prototype.json = function() {
    return JSON.stringify({
        challenge: this.challenge,
        origin: this.origin,
        typ: this.typ
    });
};

var ExtensionBridge = function() {};

ExtensionBridge.prototype.sign = function(keyHandle, toSign) {
    return new Promise(function(resolve, reject) {
        this.request = {
            type: "sign",
            keyHandle: keyHandle,
            toSign: JSON.stringify(toSign)
        };
        this.sendResponse = function(parameters) {
            resolve(parameters.signature);
        };
        this.sendRequest();
    }.bind(this));
};

ExtensionBridge.prototype.register = function(keyHandle, toSign) {
    return new Promise(function(resolve, reject) {
        this.request = {
            type: "register",
            keyHandle: keyHandle,
            toSign: JSON.stringify(toSign)
        };
        this.sendResponse = resolve;
        this.sendRequest();
    }.bind(this));
};

ExtensionBridge.prototype.run = function(parameters) {
    this.extensionCallBack = parameters.completionFunction;
    this.sendRequest();
};

ExtensionBridge.prototype.sendRequest = function() {
    if (typeof this.request == "undefined") {
        return;
    }
    if (typeof this.extensionCallBack == "undefined") {
        return;
    }
    this.extensionCallBack(this.request);
};

ExtensionBridge.prototype.finalize = function(parameters) {
    this.sendResponse(parameters);
};

var keyHandleBase = "iosSecurityKey#";

function keyHandleFromAppId(appId) {
    var d = new SHA256();
    d.update(UTIL_StringToBytes(keyHandleBase + appId));
    return d.digest();
}

function validKeyHandleForAppId(keyHandle, appId) {
    var expected = B64_encode(keyHandleFromAppId(appId));
    var actual = B64_encode(keyHandle);
    return expected == actual;
}

function RegistrationRequest(extension, appId, challenge) {
    this.extension = extension;
    this.appId = appId;
    this.challenge = challenge;
    this.keyHandle = keyHandleFromAppId(appId);
}

RegistrationRequest.Version = "U2F_V2";

RegistrationRequest.prototype.response = function() {
    return this.registrationDataBytes().then(function(regData) {
        var response = {
            version: RegistrationRequest.Version,
            registrationData: B64_encode(regData),
            clientData: B64_encode(UTIL_StringToBytes(this.clientData().json()))
        };
        return Promise.resolve(response);
    }.bind(this));
};

RegistrationRequest.prototype.registrationDataBytes = function() {
    return this.extensionResponse().then(function(extResp) {
        var bytes = [ 5 ].concat(UTIL_StringToBytes(extResp.publicKey), this.keyHandle.length, this.keyHandle, UTIL_StringToBytes(extResp.certificate), UTIL_StringToBytes(extResp.signature));
        return Promise.resolve(bytes);
    }.bind(this));
};

RegistrationRequest.prototype.extensionResponse = function() {
    var toSign = [ 0 ].concat(this.applicationParameter(), this.challengeParameter(), this.keyHandle);
    var b64KeyHandle = B64_encode(this.keyHandle);
    return this.extension.register(b64KeyHandle, toSign).then(function(resp) {
        return Promise.resolve(resp);
    });
};

RegistrationRequest.prototype.applicationParameter = function() {
    var d = new SHA256();
    d.update(UTIL_StringToBytes(this.appId));
    return d.digest();
};

RegistrationRequest.prototype.challengeParameter = function() {
    var d = new SHA256();
    d.update(UTIL_StringToBytes(this.clientData().json()));
    return d.digest();
};

RegistrationRequest.prototype.clientData = function() {
    return new ClientData(ClientData.REGISTRATION_TYP, this.challenge, this.appId);
};

function SignRequest(extension, appId, challenge, keyHandle) {
    this.extension = extension;
    this.challenge = challenge;
    this.appId = appId;
    this.keyHandle = keyHandle;
}

SignRequest.USER_PRESENCE = 1;

SignRequest.COUNTER = [ 0, 0, 0, 0 ];

SignRequest.prototype.response = function() {
    if (!validKeyHandleForAppId(this.keyHandle, this.appId)) {
        console.log("error - keyHandle appId mismatch");
        return Promise.resolve({
            errorCode: 2
        });
    }
    return this.signatureDataBytes().then(function(sigData) {
        var response = {
            clientData: B64_encode(UTIL_StringToBytes(this.clientDataJson())),
            keyHandle: B64_encode(this.keyHandle),
            signatureData: B64_encode(sigData)
        };
        return Promise.resolve(response);
    }.bind(this));
};

SignRequest.prototype.signatureDataBytes = function() {
    return this.signatureBytes().then(function(sig) {
        var bytes = [].concat(SignRequest.USER_PRESENCE, SignRequest.COUNTER, sig);
        return Promise.resolve(bytes);
    });
};

SignRequest.prototype.signatureBytes = function() {
    var toSign = [].concat(this.applicationParameter(), SignRequest.USER_PRESENCE, SignRequest.COUNTER, this.challengeParameter());
    var b64KeyHandle = B64_encode(this.keyHandle);
    return this.extension.sign(b64KeyHandle, toSign).then(function(sig) {
        return Promise.resolve(UTIL_StringToBytes(sig));
    });
};

SignRequest.prototype.clientDataJson = function() {
    var clientData = new ClientData(ClientData.AUTHENTICATION_TYP, this.challenge, this.appId);
    return clientData.json();
};

SignRequest.prototype.applicationParameter = function() {
    var d = new SHA256();
    d.update(UTIL_StringToBytes(this.appId));
    return d.digest();
};

SignRequest.prototype.challengeParameter = function() {
    var d = new SHA256();
    d.update(UTIL_StringToBytes(this.clientDataJson()));
    return d.digest();
};

function Timer(seconds) {
    this._expired = false;
    setTimeout(function() {
        this._expired = true;
    }.bind(this), seconds * 1e3);
}

Timer.prototype.expired = function() {
    return this._expired;
};

var u2fServer = function(extension) {
    this.extension = extension;
    this.rpcResponder("register", this.handleRegisterRequest);
    this.rpcResponder("sign", this.handleSignRequest);
    this.pingPong();
};

u2fServer.prototype = pingerPonger;

u2fServer.prototype.rpcResponder = function(name, requestHandler) {
    var self = this;
    self.receive(name + "-request", function() {
        requestHandler.apply(this, arguments).then(function(resp) {
            self.send(name + "-response", resp);
        }).catch(function(e) {
            console.log(name, "error", e);
            self.send(name + "-response", {
                errorCode: 2
            });
        });
    });
};

u2fServer.prototype.handleSignRequest = function(appId, challenge, registeredKeys) {
    var self = this;
    return validAppId(appId).then(function() {
        while (registeredKey = registeredKeys.shift()) {
            var keyHandle = B64_decode(registeredKey.keyHandle);
            if (validKeyHandleForAppId(keyHandle, appId)) {
                var signRequest = new SignRequest(self.extension, appId, challenge, keyHandle);
                return signRequest.response();
            }
        }
        return Promise.reject("no known key handles");
    });
};

u2fServer.prototype.handleRegisterRequest = function(appId, registerRequests, registeredKeys) {
    var self = this;
    return validAppId(appId).then(function() {
        if (registerRequests.length != 1) {
            return Promise.reject("too many registerRequests");
        }
        var registerRequest = new RegistrationRequest(self.extension, appId, registerRequests[0].challenge);
        return registerRequest.response();
    });
};

var extensionBridge = new ExtensionBridge();

var server = new u2fServer(extensionBridge);

var ExtensionPreprocessingJS = extensionBridge;
