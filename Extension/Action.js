"use strict";

function getOriginFromUrl(url) {
    var origin, re = new RegExp("^(https?://)[^/]*/?"), originarray = re.exec(url);
    if (null == originarray) return originarray;
    for (origin = originarray[0]; "/" == origin.charAt(origin.length - 1); ) origin = origin.substring(0, origin.length - 1);
    return "http:" == origin || "https:" == origin ? null : origin;
}

function getOriginsFromJson(text) {
    var urls, i, appIdData, trustedFacets, versionBlock, origins, url, origin;
    try {
        if (appIdData = JSON.parse(text), Array.isArray(appIdData)) urls = appIdData; else {
            if (trustedFacets = appIdData.trustedFacets) for (i = 0; versionBlock = trustedFacets[i]; i++) if (versionBlock.version && 1 == versionBlock.version.major && 0 == versionBlock.version.minor) {
                urls = versionBlock.ids;
                break;
            }
            if ("undefined" == typeof urls) throw Error("Could not find trustedFacets for version 1.0");
        }
        for (origins = {}, i = 0; url = urls[i]; i++) origin = getOriginFromUrl(url), origin && (origins[origin] = origin);
        return Object.keys(origins);
    } catch (e) {
        return console.error(UTIL_fmt("could not parse " + text)), [];
    }
}

function getDistinctAppIds(signChallenges) {
    var appIds, i, request, appId;
    if (!signChallenges) return [];
    for (appIds = {}, i = 0; request = signChallenges[i]; i++) appId = request.appId, 
    appId && (appIds[appId] = appId);
    return Object.keys(appIds);
}

function AppIdChecker() {}

function AppIdCheckerFactory() {}

function XhrAppIdChecker(fetcher) {
    this.fetcher_ = fetcher;
}

function XhrAppIdCheckerFactory(fetcher) {
    this.fetcher_ = fetcher;
}

function B64_encode(bytes, opt_length) {
    var b64out, result, shift, accu, inputIndex, i;
    for (opt_length || (opt_length = bytes.length), b64out = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", 
    result = "", shift = 0, accu = 0, inputIndex = 0; opt_length--; ) for (accu <<= 8, 
    accu |= bytes[inputIndex++], shift += 8; shift >= 6; ) i = accu >> shift - 6 & 63, 
    result += b64out.charAt(i), shift -= 6;
    return shift && (accu <<= 8, shift += 8, i = accu >> shift - 6 & 63, result += b64out.charAt(i)), 
    result;
}

function base64_encode(bytes, opt_length) {
    var b64out, result, shift, accu, inputIndex, i;
    for (opt_length || (opt_length = bytes.length), b64out = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", 
    result = "", shift = 0, accu = 0, inputIndex = 0; opt_length--; ) for (accu <<= 8, 
    accu |= bytes[inputIndex++], shift += 8; shift >= 6; ) i = accu >> shift - 6 & 63, 
    result += b64out.charAt(i), shift -= 6;
    for (shift && (accu <<= 8, shift += 8, i = accu >> shift - 6 & 63, result += b64out.charAt(i)); result.length % 4; ) result += "=";
    return result;
}

function B64_decode(string) {
    var i, c, bytes = [], accu = 0, shift = 0;
    for (i = 0; i < string.length; ++i) {
        if (c = string.charCodeAt(i), c < 32 || c > 127 || !B64_inmap[c - 32]) return [];
        accu <<= 6, accu |= B64_inmap[c - 32] - 1, shift += 6, shift >= 8 && (bytes.push(accu >> shift - 8 & 255), 
        shift -= 8);
    }
    return bytes;
}

function ClientData(typ, challenge, origin) {
    this.typ = typ, this.challenge = challenge, this.origin = origin;
}

function keyHandleFromAppId(appId) {
    var d = new SHA256();
    return d.update(UTIL_StringToBytes(keyHandleBase + appId)), d.digest();
}

function validKeyHandleForAppId(keyHandle, appId) {
    var expected = B64_encode(keyHandleFromAppId(appId)), actual = B64_encode(keyHandle);
    return expected == actual;
}

function RegistrationRequest(enroller, appId, challenge) {
    this.enroller = enroller, this.appId = appId, this.challenge = challenge, this.keyHandle = keyHandleFromAppId(appId);
}

function SHA256() {
    this._buf = new Array(64), this._W = new Array(64), this._pad = new Array(64), this._k = [ 1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298 ], 
    this._pad[0] = 128;
    for (var i = 1; i < 64; ++i) this._pad[i] = 0;
    this.reset();
}

function SignRequest(signer, appId, challenge, keyHandle) {
    this.signer = signer, this.challenge = challenge, this.appId = appId, this.keyHandle = keyHandle;
}

function TextFetcher() {}

function XhrTextFetcher() {}

function Timer(seconds) {
    this._expired = !1, setTimeout(function() {
        this._expired = !0;
    }.bind(this), 1e3 * seconds);
}

function TransferClient() {
    this.transferElt = document.getElementById("js-transfer"), this.transfer = this.transferElt.dataset, 
    this.serverReady = !1, this.reqReady = !1, this.eventFired("serverPong").then(function() {
        this.serverReady = !0, this.sendRequestIfReady();
    }.bind(self)), this.eventFired("serverPing").then(function() {
        this.transferElt.dispatchEvent(new Event("clientPong")), this.serverReady = !0, 
        this.sendRequestIfReady();
    }.bind(this)), this.transferElt.dispatchEvent(new Event("clientPing"));
}

function TransferServer() {
    this.transferElt = document.getElementById("js-transfer"), this.transfer = this.transferElt.dataset, 
    this.extReady = !1, this.clientReady = !1, this.eventFired("request").then(function() {
        this.clientReady = !0, this.sendRequestIfReady();
    }.bind(this)), this.eventFired("clientPing").then(function() {
        this.transferElt.dispatchEvent(new Event("serverPong"));
    }.bind(this)), this.transferElt.dispatchEvent(new Event("serverPing"));
}

function UTIL_StringToBytes(s, bytes) {
    bytes = bytes || new Array(s.length);
    for (var i = 0; i < s.length; ++i) bytes[i] = s.charCodeAt(i);
    return bytes;
}

function UTIL_BytesToString(b) {
    return String.fromCharCode.apply(null, b);
}

function UTIL_BytesToHex(b) {
    var hexchars, hexrep, i;
    if (!b) return "(null)";
    for (hexchars = "0123456789ABCDEF", hexrep = new Array(2 * b.length), i = 0; i < b.length; ++i) hexrep[2 * i + 0] = hexchars.charAt(b[i] >> 4 & 15), 
    hexrep[2 * i + 1] = hexchars.charAt(15 & b[i]);
    return hexrep.join("");
}

function UTIL_BytesToHexWithSeparator(b, sep) {
    var i, hexchars = "0123456789ABCDEF", stride = 2 + (sep ? 1 : 0), hexrep = new Array(b.length * stride);
    for (i = 0; i < b.length; ++i) sep && (hexrep[i * stride + 0] = sep), hexrep[i * stride + stride - 2] = hexchars.charAt(b[i] >> 4 & 15), 
    hexrep[i * stride + stride - 1] = hexchars.charAt(15 & b[i]);
    return (sep ? hexrep.slice(1) : hexrep).join("");
}

function UTIL_HexToBytes(h) {
    var i, hexchars = "0123456789ABCDEFabcdef", res = new Uint8Array(h.length / 2);
    for (i = 0; i < h.length && hexchars.indexOf(h.substring(i, i + 1)) != -1; i += 2) res[i / 2] = parseInt(h.substring(i, i + 2), 16);
    return res;
}

function UTIL_HexToArray(h) {
    var i, hexchars = "0123456789ABCDEFabcdef", res = new Array(h.length / 2);
    for (i = 0; i < h.length && hexchars.indexOf(h.substring(i, i + 1)) != -1; i += 2) res[i / 2] = parseInt(h.substring(i, i + 2), 16);
    return res;
}

function UTIL_equalArrays(a, b) {
    var accu, i;
    if (!a || !b) return !1;
    if (a.length != b.length) return !1;
    for (accu = 0, i = 0; i < a.length; ++i) accu |= a[i] ^ b[i];
    return 0 === accu;
}

function UTIL_ltArrays(a, b) {
    if (a.length < b.length) return !0;
    if (a.length > b.length) return !1;
    for (var i = 0; i < a.length; ++i) {
        if (a[i] < b[i]) return !0;
        if (a[i] > b[i]) return !1;
    }
    return !1;
}

function UTIL_gtArrays(a, b) {
    return UTIL_ltArrays(b, a);
}

function UTIL_geArrays(a, b) {
    return !UTIL_ltArrays(a, b);
}

function UTIL_unionArrays(a, b) {
    var i, union, k, obj = {};
    for (i = 0; i < a.length; i++) obj[a[i]] = a[i];
    for (i = 0; i < b.length; i++) obj[b[i]] = b[i];
    union = [];
    for (k in obj) union.push(obj[k]);
    return union;
}

function UTIL_getRandom(a) {
    var i, tmp = new Array(a), rnd = new Uint8Array(a);
    for (window.crypto.getRandomValues(rnd), i = 0; i < a; ++i) tmp[i] = 255 & rnd[i];
    return tmp;
}

function UTIL_setFavicon(icon) {
    var head, links, i, link, faviconLink = document.createElement("link");
    for (faviconLink.rel = "Shortcut Icon", faviconLink.type = "image/x-icon", faviconLink.href = icon, 
    head = document.getElementsByTagName("head")[0], links = head.getElementsByTagName("link"), 
    i = 0; i < links.length; i++) link = links[i], link.type == faviconLink.type && link.rel == faviconLink.rel && head.removeChild(link);
    head.appendChild(faviconLink);
}

function UTIL_clear(a) {
    if (a instanceof Array) for (var i = 0; i < a.length; ++i) a[i] = 0;
}

function UTIL_Asn1SignatureToJson(a) {
    function parseInt(off) {
        if (a[off] != UTIL_ASN_INT) return null;
        var l = 255 & a[off + 1];
        return 128 & l ? null : off + 2 + l > a.length ? null : a.slice(off + 2, off + 2 + l);
    }
    var l, r, s;
    return a.length < 6 ? null : a[0] != UTIL_ASN_SEQUENCE ? null : (l = 255 & a[1], 
    128 & l ? null : a.length != 2 + l ? null : (r = parseInt(2)) ? (s = parseInt(4 + r.length), 
    s ? {
        r: r,
        s: s
    } : null) : null);
}

function UTIL_JsonSignatureToAsn1(sig) {
    var len, buf, i, rbytes = sig.r, sbytes = sig.s;
    return 128 & rbytes[0] && rbytes.unshift(0), 128 & sbytes[0] && sbytes.unshift(0), 
    len = 4 + rbytes.length + sbytes.length, buf = new Uint8Array(2 + len), i = 0, buf[i++] = UTIL_ASN_SEQUENCE, 
    buf[i++] = len, buf[i++] = UTIL_ASN_INT, buf[i++] = rbytes.length, buf.set(rbytes, i), 
    i += rbytes.length, buf[i++] = UTIL_ASN_INT, buf[i++] = sbytes.length, buf.set(sbytes, i), 
    buf;
}

function UTIL_prepend_zero(s, n) {
    var l, i;
    if (s.length == n) return s;
    for (l = s.length, i = 0; i < n - l; ++i) s = "0" + s;
    return s;
}

function UTIL_time() {
    var d = new Date(), m = UTIL_prepend_zero((d.getMonth() + 1).toString(), 2), t = UTIL_prepend_zero(d.getDate().toString(), 2), H = UTIL_prepend_zero(d.getHours().toString(), 2), M = UTIL_prepend_zero(d.getMinutes().toString(), 2), S = UTIL_prepend_zero(d.getSeconds().toString(), 2), L = UTIL_prepend_zero((1e3 * d.getMilliseconds()).toString(), 6);
    return m + t + " " + H + ":" + M + ":" + S + "." + L;
}

function UTIL_fmt(s) {
    var line = UTIL_time() + ": " + s;
    return UTIL_events.push(line) > UTIL_max_events && UTIL_events.splice(0, UTIL_events.length - UTIL_max_events), 
    line;
}

var B64_inmap, ExtensionBridge, keyHandleBase, pingerPonger, u2fClient, u2fServer, UTIL_ASN_INT, UTIL_ASN_SEQUENCE, UTIL_events, UTIL_max_events, extensionBridge, server, ExtensionPreprocessingJS;

AppIdChecker.prototype.checkAppIds = function(timer, origin, appIds, allowHttp, opt_logMsgUrl) {}, 
AppIdCheckerFactory.prototype.create = function() {}, XhrAppIdChecker.prototype.checkAppIds = function(timer, origin, appIds, allowHttp, opt_logMsgUrl) {
    var appIdsMap, i, self, appIdChecks;
    if (this.timer_) return Promise.resolve(!1);
    if (this.timer_ = timer, this.origin_ = origin, appIdsMap = {}, appIds) for (i = 0; i < appIds.length; i++) appIdsMap[appIds[i]] = appIds[i];
    return this.distinctAppIds_ = Object.keys(appIdsMap), this.allowHttp_ = allowHttp, 
    this.logMsgUrl_ = opt_logMsgUrl, this.distinctAppIds_.length ? this.allAppIdsEqualOrigin_() ? Promise.resolve(!0) : (self = this, 
    appIdChecks = self.distinctAppIds_.map(self.checkAppId_.bind(self)), Promise.all(appIdChecks).then(function(results) {
        return results.every(function(result) {
            return result;
        });
    })) : Promise.resolve(!1);
}, XhrAppIdChecker.prototype.checkAppId_ = function(appId) {
    var p, self;
    return appId == this.origin_ ? Promise.resolve(!0) : (p = this.fetchAllowedOriginsForAppId_(appId), 
    self = this, p.then(function(allowedOrigins) {
        return allowedOrigins.indexOf(self.origin_) != -1 || (console.warn(UTIL_fmt("Origin " + self.origin_ + " not allowed by app id " + appId)), 
        !1);
    }));
}, XhrAppIdChecker.prototype.allAppIdsEqualOrigin_ = function() {
    var self = this;
    return this.distinctAppIds_.every(function(appId) {
        return appId == self.origin_;
    });
}, XhrAppIdChecker.prototype.fetchAllowedOriginsForAppId_ = function(appId) {
    var origin, p, self;
    return console.log("fetching allowed origins for " + appId), appId ? 0 != appId.indexOf("http://") || this.allowHttp_ ? (origin = getOriginFromUrl(appId)) ? (p = this.fetcher_.fetch(appId), 
    self = this, p.then(getOriginsFromJson, function(rc_) {
        var rc = rc_;
        return console.log(UTIL_fmt("fetching " + appId + " failed: " + rc)), rc >= 400 && rc < 500 || self.timer_.expired() ? [] : self.fetchAllowedOriginsForAppId_(appId);
    })) : Promise.resolve([]) : (console.log(UTIL_fmt("http app ids disallowed, " + appId + " requested")), 
    Promise.resolve([])) : Promise.resolve([]);
}, XhrAppIdCheckerFactory.prototype.create = function() {
    return new XhrAppIdChecker(this.fetcher_);
}, B64_inmap = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 0, 0, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 0, 0, 0, 0, 64, 0, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 0, 0, 0, 0, 0 ], 
ClientData.AUTHENTICATION_TYP = "navigator.id.getAssertion", ClientData.REGISTRATION_TYP = "navigator.id.finishEnrollment", 
ClientData.prototype.json = function() {
    return JSON.stringify({
        challenge: this.challenge,
        origin: this.origin,
        typ: this.typ
    });
}, ExtensionBridge = function() {}, ExtensionBridge.prototype.sign = function(keyHandle, toSign) {
    return console.log("ExtensionBridge.prototype.sign"), new Promise(function(resolve, reject) {
        this.request = {
            type: "sign",
            keyHandle: keyHandle,
            toSign: JSON.stringify(toSign)
        }, this.sendResponse = function(parameters) {
            resolve(parameters.signature);
        }, this.sendRequest();
    }.bind(this));
}, ExtensionBridge.prototype.register = function(keyHandle, toSign) {
    return console.log("ExtensionBridge.prototype.register"), new Promise(function(resolve, reject) {
        this.request = {
            type: "register",
            keyHandle: keyHandle,
            toSign: JSON.stringify(toSign)
        }, this.sendResponse = resolve, this.sendRequest();
    }.bind(this));
}, ExtensionBridge.prototype.run = function(parameters) {
    console.log("ExtensionBridge.prototype.run"), this.extensionCallBack = parameters.completionFunction, 
    this.sendRequest();
}, ExtensionBridge.prototype.sendRequest = function() {
    "undefined" != typeof this.request && "undefined" != typeof this.extensionCallBack && (console.log("ExtensionBridge.prototype.sendRequest"), 
    console.log(this.request), this.extensionCallBack(this.request));
}, ExtensionBridge.prototype.finalize = function(parameters) {
    console.log("ExtensionBridge.prototype.finalize"), this.sendResponse(parameters);
}, keyHandleBase = "iosSecurityKey#", pingerPonger = {
    pingPong: function() {
        this.whenReady_ = [], this.isReady_ = !1, this.send("ping", 1), this.receive("pong").then(function() {
            this.isReady();
        }.bind(this)), this.receive("ping").then(function() {
            this.send("pong", 1), this.isReady();
        }.bind(this));
    },
    findOrMakeTransferElt: function() {
        this.transferElt = document.getElementById("u2f-transfer"), this.transferElt || (this.transferElt = document.createElement("span"), 
        this.transferElt.id = "u2f-transfer", document.documentElement.appendChild(this.transferElt));
    },
    receive: function(name) {
        return new Promise(function(resolve, reject) {
            this.transferElt.addEventListener(name, function() {
                console.log("pingerPonger receiving " + name), resolve(JSON.parse(this.transferElt.dataset[name]));
            }.bind(this));
        }.bind(this));
    },
    send: function(name, value) {
        console.log("pingerPonger sending " + name), this.transferElt.dataset[name] = JSON.stringify(value), 
        this.transferElt.dispatchEvent(new Event(name));
    },
    whenReady: function() {
        return this.isReady_ ? Promise.resolve() : new Promise(function(resolve, reject) {
            this.whenReady_.push(resolve);
        }.bind(this));
    },
    isReady: function() {
        this.isReady_ = !0;
        var i;
        for (i = 0; i < this.whenReady_.length; i++) this.whenReady_[i]();
    }
}, RegistrationRequest.Version = "U2F_V2", RegistrationRequest.prototype.response = function() {
    return this.registrationDataBytes().then(function(regData) {
        var response = {
            version: RegistrationRequest.Version,
            registrationData: B64_encode(regData),
            clientData: B64_encode(UTIL_StringToBytes(this.clientData().json()))
        };
        return Promise.resolve(response);
    }.bind(this));
}, RegistrationRequest.prototype.registrationDataBytes = function() {
    return this.extensionResponse().then(function(extResp) {
        var bytes = [ 5 ].concat(UTIL_StringToBytes(extResp.publicKey), this.keyHandle.length, this.keyHandle, UTIL_StringToBytes(extResp.certificate), UTIL_StringToBytes(extResp.signature));
        return Promise.resolve(bytes);
    }.bind(this));
}, RegistrationRequest.prototype.extensionResponse = function() {
    var toSign = [ 0 ].concat(this.applicationParameter(), this.challengeParameter(), this.keyHandle), b64KeyHandle = B64_encode(this.keyHandle);
    return this.enroller.register(b64KeyHandle, toSign).then(function(resp) {
        return Promise.resolve(resp);
    });
}, RegistrationRequest.prototype.applicationParameter = function() {
    var d = new SHA256();
    return d.update(UTIL_StringToBytes(this.appId)), d.digest();
}, RegistrationRequest.prototype.challengeParameter = function() {
    var d = new SHA256();
    return d.update(UTIL_StringToBytes(this.clientData().json())), d.digest();
}, RegistrationRequest.prototype.clientData = function() {
    return new ClientData(ClientData.REGISTRATION_TYP, this.challenge, this.appId);
}, SHA256.prototype.reset = function() {
    this._chain = [ 1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225 ], 
    this._inbuf = 0, this._total = 0;
}, SHA256.prototype._compress = function(buf) {
    function _rotr(w, r) {
        return w << 32 - r | w >>> r;
    }
    var i, w, s0, s1, A, B, C, D, E, F, G, H, S0, maj, t2, S1, ch, t1, W = this._W, k = this._k;
    for (i = 0; i < 64; i += 4) w = buf[i] << 24 | buf[i + 1] << 16 | buf[i + 2] << 8 | buf[i + 3], 
    W[i / 4] = w;
    for (i = 16; i < 64; ++i) s0 = _rotr(W[i - 15], 7) ^ _rotr(W[i - 15], 18) ^ W[i - 15] >>> 3, 
    s1 = _rotr(W[i - 2], 17) ^ _rotr(W[i - 2], 19) ^ W[i - 2] >>> 10, W[i] = W[i - 16] + s0 + W[i - 7] + s1 & 4294967295;
    for (A = this._chain[0], B = this._chain[1], C = this._chain[2], D = this._chain[3], 
    E = this._chain[4], F = this._chain[5], G = this._chain[6], H = this._chain[7], 
    i = 0; i < 64; ++i) S0 = _rotr(A, 2) ^ _rotr(A, 13) ^ _rotr(A, 22), maj = A & B ^ A & C ^ B & C, 
    t2 = S0 + maj & 4294967295, S1 = _rotr(E, 6) ^ _rotr(E, 11) ^ _rotr(E, 25), ch = E & F ^ ~E & G, 
    t1 = H + S1 + ch + k[i] + W[i] & 4294967295, H = G, G = F, F = E, E = D + t1 & 4294967295, 
    D = C, C = B, B = A, A = t1 + t2 & 4294967295;
    this._chain[0] += A, this._chain[1] += B, this._chain[2] += C, this._chain[3] += D, 
    this._chain[4] += E, this._chain[5] += F, this._chain[6] += G, this._chain[7] += H;
}, SHA256.prototype.update = function(bytes, opt_length) {
    opt_length || (opt_length = bytes.length), this._total += opt_length;
    for (var n = 0; n < opt_length; ++n) this._buf[this._inbuf++] = bytes[n], 64 == this._inbuf && (this._compress(this._buf), 
    this._inbuf = 0);
}, SHA256.prototype.updateRange = function(bytes, start, end) {
    this._total += end - start;
    for (var n = start; n < end; ++n) this._buf[this._inbuf++] = bytes[n], 64 == this._inbuf && (this._compress(this._buf), 
    this._inbuf = 0);
}, SHA256.prototype.digest = function(var_args) {
    var i, digest, totalBits, n, j;
    for (i = 0; i < arguments.length; ++i) this.update(arguments[i]);
    for (digest = new Array(32), totalBits = 8 * this._total, this._inbuf < 56 ? this.update(this._pad, 56 - this._inbuf) : this.update(this._pad, 64 - (this._inbuf - 56)), 
    i = 63; i >= 56; --i) this._buf[i] = 255 & totalBits, totalBits >>>= 8;
    for (this._compress(this._buf), n = 0, i = 0; i < 8; ++i) for (j = 24; j >= 0; j -= 8) digest[n++] = this._chain[i] >> j & 255;
    return digest;
}, SignRequest.USER_PRESENCE = 1, SignRequest.COUNTER = [ 0, 0, 0, 0 ], SignRequest.prototype.response = function() {
    return validKeyHandleForAppId(this.keyHandle, this.appId) ? this.signatureDataBytes().then(function(sigData) {
        var response = {
            clientData: B64_encode(UTIL_StringToBytes(this.clientDataJson())),
            keyHandle: B64_encode(this.keyHandle),
            signatureData: B64_encode(sigData)
        };
        return Promise.resolve(response);
    }.bind(this)) : (console.log("keyHandle appId mismatch"), Promise.resolve({
        errorCode: 2
    }));
}, SignRequest.prototype.signatureDataBytes = function() {
    return this.signatureBytes().then(function(sig) {
        var bytes = [].concat(SignRequest.USER_PRESENCE, SignRequest.COUNTER, sig);
        return Promise.resolve(bytes);
    });
}, SignRequest.prototype.signatureBytes = function() {
    var toSign = [].concat(this.applicationParameter(), SignRequest.USER_PRESENCE, SignRequest.COUNTER, this.challengeParameter()), b64KeyHandle = B64_encode(this.keyHandle);
    return this.signer.sign(b64KeyHandle, toSign).then(function(sig) {
        return Promise.resolve(UTIL_StringToBytes(sig));
    });
}, SignRequest.prototype.clientDataJson = function() {
    var clientData = new ClientData(ClientData.AUTHENTICATION_TYP, this.challenge, this.appId);
    return clientData.json();
}, SignRequest.prototype.applicationParameter = function() {
    var d = new SHA256();
    return d.update(UTIL_StringToBytes(this.appId)), d.digest();
}, SignRequest.prototype.challengeParameter = function() {
    var d = new SHA256();
    return d.update(UTIL_StringToBytes(this.clientDataJson())), d.digest();
}, TextFetcher.prototype.fetch = function(url, opt_method, opt_body) {}, XhrTextFetcher.prototype.fetch = function(url, opt_method, opt_body) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest(), method = opt_method || "GET";
        xhr.open(method, url, !0), xhr.onloadend = function() {
            return 200 != xhr.status ? void reject(xhr.status) : void resolve(xhr.responseText);
        }, xhr.onerror = function() {
            reject(404);
        }, opt_body ? xhr.send(opt_body) : xhr.send();
    });
}, Timer.prototype.expired = function() {
    return this._expired;
}, TransferClient.prototype.sign = function(appId, toSign) {
    this.transfer.request = JSON.stringify({
        type: "sign",
        appId: appId,
        toSign: JSON.stringify(toSign)
    });
    var promise = this.eventFired("response").then(function() {
        var parsed = JSON.parse(this.transfer.response);
        return Promise.resolve(parsed.signature);
    }.bind(this));
    return this.reqReady = !0, this.sendRequestIfReady(), promise;
}, TransferClient.prototype.register = function(appId, toSign) {
    this.transfer.request = JSON.stringify({
        type: "register",
        appId: appId,
        toSign: JSON.stringify(toSign)
    });
    var promise = this.eventFired("response").then(function() {
        var parsed = JSON.parse(this.transfer.response);
        return Promise.resolve(parsed);
    }.bind(this));
    return this.reqReady = !0, this.sendRequestIfReady(), promise;
}, TransferClient.prototype.eventFired = function(name) {
    return new Promise(function(resolve, reject) {
        this.transferElt.addEventListener(name, resolve);
    }.bind(this));
}, TransferClient.prototype.sendRequestIfReady = function() {
    this.serverReady && this.reqReady && (this.serverReady = this.reqReady = !1, this.transferElt.dispatchEvent(new Event("request")));
}, TransferServer.prototype.run = function(parameters) {
    this.extensionCallBack = parameters.completionFunction, this.extReady = !0, this.sendRequestIfReady();
}, TransferServer.prototype.finalize = function(parameters) {
    this.transfer.response = JSON.stringify(parameters), this.transferElt.dispatchEvent(new Event("response"));
}, TransferServer.prototype.sendRequestIfReady = function() {
    if (this.extReady && this.clientReady) {
        this.extReady = this.clientReady = !1;
        var parsed = JSON.parse(this.transfer.request);
        this.extensionCallBack(parsed);
    }
}, TransferServer.prototype.eventFired = function(name) {
    return new Promise(function(resolve, reject) {
        this.transferElt.addEventListener(name, resolve);
    }.bind(this));
}, u2fClient = function() {
    this.findOrMakeTransferElt(), this.pingPong();
}, u2fClient.prototype = pingerPonger, u2fClient.prototype.register = function(appId, registerRequests, registeredKeys, responseHandler) {
    this.whenReady().then(function() {
        this.receive("response").then(responseHandler), this.send("request", {
            type: "register",
            appId: appId,
            registerRequests: registerRequests,
            registeredKeys: registeredKeys
        });
    }.bind(this));
}, u2fClient.prototype.sign = function(appId, challenge, registeredKeys, responseHandler) {
    this.whenReady().then(function() {
        this.receive("response").then(responseHandler), this.send("request", {
            type: "sign",
            appId: appId,
            challenge: challenge,
            registeredKeys: registeredKeys
        });
    }.bind(this));
}, u2fServer = function() {
    this.findOrMakeTransferElt(), this.receive("request").then(this.handleRequest.bind(this)), 
    this.pingPong();
}, u2fServer.prototype = pingerPonger, u2fServer.prototype.handleRequest = function(req) {
    var type = req.type, appId = req.appId, challenge = req.challenge, registeredKeys = req.registeredKeys, registerRequests = req.registerRequests;
    this.timer = new Timer(30), this.validAppId(appId).then(function(valid) {
        if (!valid) return console.log("error - bad appId"), void this.send("response", {
            errorCode: 2
        });
        switch (type) {
          case "register":
            this.handleRegisterRequest(appId, registerRequests);
            break;

          case "sign":
            this.handleSignRequest(appId, challenge, registeredKeys);
            break;

          default:
            console.log("error - unknown request type"), this.send("response", {
                errorCode: 2
            });
        }
    }.bind(this)).catch(function(err) {
        console.log("error checking appId"), console.log(err), this.send("response", {
            errorCode: 2
        });
    }.bind(this));
}, u2fServer.prototype.validAppId = function(appId) {
    var textFetcher = new XhrTextFetcher(), xhrAppIdCheckerFactory = new XhrAppIdCheckerFactory(textFetcher), appIdChecker = xhrAppIdCheckerFactory.create();
    return appIdChecker.checkAppIds(this.timer, window.location.origin, [ appId ], !0);
}, u2fServer.prototype.handleSignRequest = function(appId, challenge, registeredKeys) {
    var i, registeredKey, keyHandle, signRequest;
    for (i = 0; i < registeredKeys.length; i++) if (registeredKey = registeredKeys[i], 
    keyHandle = B64_decode(registeredKey.keyHandle), validKeyHandleForAppId(keyHandle, appId)) return signRequest = new SignRequest(extensionBridge, appId, challenge, keyHandle), 
    signRequest.response().then(function(resp) {
        this.send("response", resp);
    }.bind(this));
    console.log("error - no valid keyIds for appId"), this.send("response", {
        errorCode: 2
    });
}, u2fServer.prototype.handleRegisterRequest = function(appId, registerRequests) {
    if (1 != registerRequests.length) return console.log("error - multiple registerRequests"), 
    this.send("response", {
        errorCode: 2
    });
    var registerRequest = new RegistrationRequest(extensionBridge, appId, registerRequests[0].challenge);
    registerRequest.response().then(function(resp) {
        this.send("response", resp);
    }.bind(this));
}, UTIL_ASN_INT = 2, UTIL_ASN_SEQUENCE = 48, UTIL_events = [], UTIL_max_events = 500, 
extensionBridge = new ExtensionBridge(), server = new u2fServer(), ExtensionPreprocessingJS = extensionBridge;
