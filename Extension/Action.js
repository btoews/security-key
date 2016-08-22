"use strict";

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

function CountdownTimer(sysTimer, timeoutMillis, cb) {
    this.sysTimer_ = sysTimer, this.remainingMillis = 0, this.setTimeout(timeoutMillis || 0, cb);
}

function CountdownTimerFactory(sysTimer) {
    this.sysTimer_ = sysTimer;
}

function attenuateTimeoutInSeconds(timeoutSeconds, opt_attenuationSeconds) {
    var attenuationSeconds = opt_attenuationSeconds || MINIMUM_TIMEOUT_ATTENUATION_SECONDS;
    return timeoutSeconds < attenuationSeconds ? 0 : timeoutSeconds - attenuationSeconds;
}

function getTimeoutValueFromRequest(request, opt_defaultTimeoutSeconds) {
    var timeoutValueSeconds;
    return timeoutValueSeconds = request.hasOwnProperty("timeoutSeconds") ? request.timeoutSeconds : request.hasOwnProperty("timeout") ? request.timeout : void 0 !== opt_defaultTimeoutSeconds ? opt_defaultTimeoutSeconds : DEFAULT_REQUEST_TIMEOUT_SECONDS;
}

function createAttenuatedTimer(timerFactory, timeoutValueSeconds, opt_attenuationSeconds) {
    return timeoutValueSeconds = attenuateTimeoutInSeconds(timeoutValueSeconds, opt_attenuationSeconds), 
    timerFactory.createTimer(1e3 * timeoutValueSeconds);
}

function CryptoTokenApprovedOrigin() {}

function CryptoTokenOriginChecker() {}

function handleU2fEnrollRequest(messageSender, request, sendResponse) {
    function sendErrorResponse(error) {
        var response = makeU2fErrorResponse(request, error.errorCode, error.errorMessage);
        sendResponseOnce(sentResponse, closeable, response, sendResponse);
    }
    function sendSuccessResponse(u2fVersion, info, clientData) {
        var responseData, response, enrollChallenges = request.registerRequests, enrollChallenge = findEnrollChallengeOfVersion(enrollChallenges, u2fVersion);
        return enrollChallenge ? (responseData = makeEnrollResponseData(enrollChallenge, u2fVersion, info, clientData), 
        response = makeU2fSuccessResponse(request, responseData), void sendResponseOnce(sentResponse, closeable, response, sendResponse)) : void sendErrorResponse({
            errorCode: ErrorCodes.OTHER_ERROR
        });
    }
    function timeout() {
        sendErrorResponse({
            errorCode: ErrorCodes.TIMEOUT
        });
    }
    var timeoutValueSeconds, watchdogTimeoutValueSeconds, watchdog, wrappedErrorCb, wrappedSuccessCb, timer, logMsgUrl, enroller, registerRequests, signRequests, sentResponse = !1, closeable = null, sender = createSenderFromMessageSender(messageSender);
    return sender && (0 != sender.origin.indexOf("http://") || HTTP_ORIGINS_ALLOWED) && isValidEnrollRequest(request) ? (timeoutValueSeconds = getTimeoutValueFromRequest(request), 
    watchdogTimeoutValueSeconds = attenuateTimeoutInSeconds(timeoutValueSeconds, .5), 
    watchdog = new WatchdogRequestHandler(watchdogTimeoutValueSeconds, timeout), wrappedErrorCb = watchdog.wrapCallback(sendErrorResponse), 
    wrappedSuccessCb = watchdog.wrapCallback(sendSuccessResponse), timer = createAttenuatedTimer(FACTORY_REGISTRY.getCountdownFactory(), timeoutValueSeconds), 
    logMsgUrl = request.logMsgUrl, enroller = new Enroller(timer, sender, sendErrorResponse, sendSuccessResponse, logMsgUrl), 
    watchdog.setCloseable(enroller), closeable = watchdog, registerRequests = request.registerRequests, 
    signRequests = getSignRequestsFromEnrollRequest(request), enroller.doEnroll(registerRequests, signRequests, request.appId), 
    closeable) : (sendErrorResponse({
        errorCode: ErrorCodes.BAD_REQUEST
    }), null);
}

function isValidEnrollRequest(request) {
    var enrollChallenges, hasAppId, signChallenges, challengeRequired;
    return !!request.hasOwnProperty("registerRequests") && (enrollChallenges = request.registerRequests, 
    !!enrollChallenges.length && (hasAppId = request.hasOwnProperty("appId"), !!isValidEnrollChallengeArray(enrollChallenges, !hasAppId) && (signChallenges = getSignChallenges(request), 
    challengeRequired = !1, !(signChallenges && !isValidSignChallengeArray(signChallenges, challengeRequired, !hasAppId)))));
}

function isValidEnrollChallengeArray(enrollChallenges, appIdRequired) {
    var i, enrollChallenge, version, seenVersions = {};
    for (i = 0; i < enrollChallenges.length; i++) {
        if (enrollChallenge = enrollChallenges[i], version = enrollChallenge.version, version || (version = "U2F_V1"), 
        "U2F_V1" != version && "U2F_V2" != version) return !1;
        if (seenVersions[version]) return !1;
        if (seenVersions[version] = version, appIdRequired && !enrollChallenge.appId) return !1;
        if (!enrollChallenge.challenge) return !1;
    }
    return !0;
}

function findEnrollChallengeOfVersion(enrollChallenges, version) {
    for (var i = 0; i < enrollChallenges.length; i++) if (enrollChallenges[i].version == version) return enrollChallenges[i];
    return null;
}

function makeEnrollResponseData(enrollChallenge, u2fVersion, registrationData, opt_clientData) {
    var k, responseData = {};
    responseData.registrationData = registrationData;
    for (k in enrollChallenge) responseData[k] = enrollChallenge[k];
    return "U2F_V2" == u2fVersion && (responseData.clientData = opt_clientData), responseData;
}

function getSignRequestsFromEnrollRequest(request) {
    var signChallenges, i;
    if (signChallenges = request.hasOwnProperty("registeredKeys") ? request.registeredKeys : request.signRequests) for (i = 0; i < signChallenges.length; i++) signChallenges[i].hasOwnProperty("challenge") || (signChallenges[i].challenge = "");
    return signChallenges;
}

function Enroller(timer, sender, errorCb, successCb, opt_logMsgUrl) {
    this.timer_ = timer, this.sender_ = sender, this.errorCb_ = errorCb, this.successCb_ = successCb, 
    this.logMsgUrl_ = opt_logMsgUrl, this.done_ = !1, this.browserData_ = {}, this.encodedEnrollChallenges_ = [], 
    this.encodedSignChallenges_ = [], this.allowHttp_ = !!this.sender_.origin && 0 == this.sender_.origin.indexOf("http://"), 
    this.handler_ = null;
}

function FactoryRegistry(appIdCheckerFactory, approvedOrigins, countdownFactory, originChecker, requestHelper, sysTimer, textFetcher) {
    this.appIdCheckerFactory_ = appIdCheckerFactory, this.approvedOrigins_ = approvedOrigins, 
    this.countdownFactory_ = countdownFactory, this.originChecker_ = originChecker, 
    this.requestHelper_ = requestHelper, this.sysTimer_ = sysTimer, this.textFetcher_ = textFetcher;
}

function GenericRequestHelper() {
    this.handlerFactories_ = {};
}

function SHA256() {
    this._buf = new Array(64), this._W = new Array(64), this._pad = new Array(64), this._k = [ 1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298 ], 
    this._pad[0] = 128;
    for (var i = 1; i < 64; ++i) this._pad[i] = 0;
    this.reset();
}

function initRequestQueue() {
    gnubbySignRequestQueue = new OriginKeyedRequestQueue(FACTORY_REGISTRY.getSystemTimer());
}

function handleU2fSignRequest(messageSender, request, sendResponse) {
    function sendErrorResponse(error) {
        sendResponseOnce(sentResponse, queuedSignRequest, makeU2fErrorResponse(request, error.errorCode, error.errorMessage), sendResponse);
    }
    function sendSuccessResponse(challenge, info, browserData) {
        var response, responseData = makeU2fSignResponseDataFromChallenge(challenge);
        addSignatureAndBrowserDataToResponseData(responseData, info, browserData, "clientData"), 
        response = makeU2fSuccessResponse(request, responseData), sendResponseOnce(sentResponse, queuedSignRequest, response, sendResponse);
    }
    var queuedSignRequest, sentResponse = !1, sender = createSenderFromMessageSender(messageSender);
    return sender && (0 != sender.origin.indexOf("http://") || HTTP_ORIGINS_ALLOWED) ? queuedSignRequest = validateAndEnqueueSignRequest(sender, request, sendErrorResponse, sendSuccessResponse) : (sendErrorResponse({
        errorCode: ErrorCodes.BAD_REQUEST
    }), null);
}

function makeU2fSignResponseDataFromChallenge(challenge) {
    var responseData = {
        keyHandle: challenge.keyHandle
    };
    return responseData;
}

function addSignatureAndBrowserDataToResponseData(responseData, signatureData, browserData, browserDataName) {
    responseData[browserDataName] = B64_encode(UTIL_StringToBytes(browserData)), responseData.signatureData = signatureData;
}

function validateAndEnqueueSignRequest(sender, request, errorCb, successCb) {
    function timeout() {
        errorCb({
            errorCode: ErrorCodes.TIMEOUT
        });
    }
    var signChallenges, appId, timeoutValueSeconds, watchdog, wrappedErrorCb, wrappedSuccessCb, timer, logMsgUrl, queuedSignRequest, requestToken;
    return isValidSignRequest(request) ? (signChallenges = getSignChallenges(request), 
    request.appId ? appId = request.appId : signChallenges.length && (appId = signChallenges[0].appId), 
    appId ? (timeoutValueSeconds = getTimeoutValueFromRequest(request), timeoutValueSeconds = attenuateTimeoutInSeconds(timeoutValueSeconds, .5), 
    watchdog = new WatchdogRequestHandler(timeoutValueSeconds, timeout), wrappedErrorCb = watchdog.wrapCallback(errorCb), 
    wrappedSuccessCb = watchdog.wrapCallback(successCb), timer = createAttenuatedTimer(FACTORY_REGISTRY.getCountdownFactory(), timeoutValueSeconds), 
    logMsgUrl = request.logMsgUrl, queuedSignRequest = new QueuedSignRequest(signChallenges, timer, sender, wrappedErrorCb, wrappedSuccessCb, request.challenge, appId, logMsgUrl), 
    gnubbySignRequestQueue || initRequestQueue(), requestToken = gnubbySignRequestQueue.queueRequest(appId, sender.origin, queuedSignRequest.begin.bind(queuedSignRequest), timer), 
    queuedSignRequest.setToken(requestToken), watchdog.setCloseable(queuedSignRequest), 
    watchdog) : (console.warn(UTIL_fmt("empty sign appId?")), errorCb({
        errorCode: ErrorCodes.BAD_REQUEST
    }), null)) : (errorCb({
        errorCode: ErrorCodes.BAD_REQUEST
    }), null);
}

function isValidSignRequest(request) {
    var hasDefaultChallenge, hasAppId, signChallenges = getSignChallenges(request);
    return !!signChallenges && (hasDefaultChallenge = request.hasOwnProperty("challenge"), 
    hasAppId = request.hasOwnProperty("appId"), !!(hasAppId || signChallenges && signChallenges.length) && isValidSignChallengeArray(signChallenges, !hasDefaultChallenge, !hasAppId));
}

function QueuedSignRequest(signChallenges, timer, sender, errorCb, successCb, opt_defaultChallenge, opt_appId, opt_logMsgUrl) {
    this.signChallenges_ = signChallenges, this.timer_ = timer.clone(this.close.bind(this)), 
    this.sender_ = sender, this.errorCb_ = errorCb, this.successCb_ = successCb, this.defaultChallenge_ = opt_defaultChallenge, 
    this.appId_ = opt_appId, this.logMsgUrl_ = opt_logMsgUrl, this.begun_ = !1, this.closed_ = !1;
}

function Signer(timer, sender, errorCb, successCb, opt_logMsgUrl) {
    this.timer_ = timer.clone(), this.sender_ = sender, this.errorCb_ = errorCb, this.successCb_ = successCb, 
    this.logMsgUrl_ = opt_logMsgUrl, this.challengesSet_ = !1, this.done_ = !1, this.browserData_ = {}, 
    this.serverChallenges_ = {}, this.allowHttp_ = !!this.sender_.origin && 0 == this.sender_.origin.indexOf("http://"), 
    this.handler_ = null;
}

function TextFetcher() {}

function XhrTextFetcher() {}

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

function WatchdogRequestHandler(timeoutValueSeconds, opt_timeoutCb) {
    this.timeoutValueSeconds_ = timeoutValueSeconds, this.timeoutCb_ = opt_timeoutCb, 
    this.calledBack_ = !1, this.timer_ = FACTORY_REGISTRY.getCountdownFactory().createTimer(1e3 * this.timeoutValueSeconds_, this.timeout_.bind(this)), 
    this.closeable_ = void 0, this.closed_ = !1;
}

function getOriginFromUrl(url) {
    var origin, re = new RegExp("^(https?://)[^/]*/?"), originarray = re.exec(url);
    if (null == originarray) return originarray;
    for (origin = originarray[0]; "/" == origin.charAt(origin.length - 1); ) origin = origin.substring(0, origin.length - 1);
    return "http:" == origin || "https:" == origin ? null : origin;
}

function isValidRegisteredKey(registeredKey, appIdRequired) {
    return !(appIdRequired && !registeredKey.hasOwnProperty("appId")) && (!!registeredKey.hasOwnProperty("keyHandle") && (!registeredKey.version || "U2F_V1" == registeredKey.version || "U2F_V2" == registeredKey.version));
}

function isValidRegisteredKeyArray(registeredKeys, appIdRequired) {
    return registeredKeys.every(function(key) {
        return isValidRegisteredKey(key, appIdRequired);
    });
}

function getSignChallenges(request) {
    if (request) {
        var signChallenges;
        return request.hasOwnProperty("signRequests") ? signChallenges = request.signRequests : request.hasOwnProperty("registeredKeys") && (signChallenges = request.registeredKeys), 
        signChallenges;
    }
}

function isValidSignChallengeArray(signChallenges, challengeValueRequired, appIdRequired) {
    var i, incomingChallenge;
    for (i = 0; i < signChallenges.length; i++) {
        if (incomingChallenge = signChallenges[i], challengeValueRequired && !incomingChallenge.hasOwnProperty("challenge")) return !1;
        if (!isValidRegisteredKey(incomingChallenge, appIdRequired)) return !1;
    }
    return !0;
}

function handleWebPageRequest(request, sender, sendResponse) {
    switch (request.type) {
      case MessageTypes.U2F_REGISTER_REQUEST:
        return handleU2fEnrollRequest(sender, request, sendResponse);

      case MessageTypes.U2F_SIGN_REQUEST:
        return handleU2fSignRequest(sender, request, sendResponse);

      case MessageTypes.U2F_GET_API_VERSION_REQUEST:
        return sendResponse(makeU2fGetApiVersionResponse(request, JS_API_VERSION, MessageTypes.U2F_GET_API_VERSION_RESPONSE)), 
        null;

      default:
        return sendResponse(makeU2fErrorResponse(request, ErrorCodes.BAD_REQUEST, void 0, MessageTypes.U2F_REGISTER_RESPONSE)), 
        null;
    }
}

function makeResponseForRequest(request, responseSuffix, opt_defaultType) {
    var type, reply;
    return type = request && request.type ? request.type.replace(/_request$/, responseSuffix) : opt_defaultType, 
    reply = {
        type: type
    }, request && request.requestId && (reply.requestId = request.requestId), reply;
}

function makeU2fErrorResponse(request, code, opt_detail, opt_defaultType) {
    var reply = makeResponseForRequest(request, "_response", opt_defaultType), error = {
        errorCode: code
    };
    return opt_detail && (error.errorMessage = opt_detail), reply.responseData = error, 
    reply;
}

function makeU2fSuccessResponse(request, responseData) {
    var reply = makeResponseForRequest(request, "_response");
    return reply.responseData = responseData, reply;
}

function mapDeviceStatusCodeToU2fError(code) {
    switch (code) {
      case DeviceStatusCodes.WRONG_DATA_STATUS:
        return {
            errorCode: ErrorCodes.DEVICE_INELIGIBLE
        };

      case DeviceStatusCodes.TIMEOUT_STATUS:
      case DeviceStatusCodes.WAIT_TOUCH_STATUS:
        return {
            errorCode: ErrorCodes.TIMEOUT
        };

      default:
        var reportedError = {
            errorCode: ErrorCodes.OTHER_ERROR,
            errorMessage: "device status code: " + code.toString(16)
        };
        return reportedError;
    }
}

function sendResponseOnce(sentResponse, closeable, response, sendResponse) {
    if (closeable && closeable.close(), sentResponse) console.warn(UTIL_fmt("Tried to reply more than once!")); else {
        sentResponse = !0;
        try {
            sendResponse(response);
        } catch (exception) {
            console.warn("sendResponse failed: " + exception);
        }
    }
}

function sha256HashOfString(string) {
    var s = new SHA256();
    return s.update(UTIL_StringToBytes(string)), s.digest();
}

function tlsChannelIdValue(opt_tlsChannelId) {
    if (!opt_tlsChannelId) return UNUSED_CID_PUBKEY_VALUE;
    if ("string" == typeof opt_tlsChannelId) try {
        var obj = JSON.parse(opt_tlsChannelId);
        return obj ? obj : UNUSED_CID_PUBKEY_VALUE;
    } catch (e) {
        console.warn("Unparseable TLS channel ID value " + opt_tlsChannelId);
    }
    return opt_tlsChannelId;
}

function makeBrowserData(type, serverChallenge, origin, opt_tlsChannelId) {
    var browserData = {
        typ: type,
        challenge: serverChallenge,
        origin: origin
    };
    return BROWSER_SUPPORTS_TLS_CHANNEL_ID && (browserData.cid_pubkey = tlsChannelIdValue(opt_tlsChannelId)), 
    JSON.stringify(browserData);
}

function makeEnrollBrowserData(serverChallenge, origin, opt_tlsChannelId) {
    return makeBrowserData("navigator.id.finishEnrollment", serverChallenge, origin, opt_tlsChannelId);
}

function makeSignBrowserData(serverChallenge, origin, opt_tlsChannelId) {
    return makeBrowserData("navigator.id.getAssertion", serverChallenge, origin, opt_tlsChannelId);
}

function makeU2fGetApiVersionResponse(request, version, opt_defaultType) {
    var reply = makeResponseForRequest(request, "_response", opt_defaultType), data = {
        js_api_version: version
    };
    return reply.responseData = data, reply;
}

function encodeSignChallenges(signChallenges, opt_defaultChallenge, opt_defaultAppId, opt_challengeHashFunction) {
    function encodedSha256(keyHandle, challenge) {
        return B64_encode(sha256HashOfString(challenge));
    }
    var i, challenge, keyHandle, challengeValue, challengeHash, appId, encodedChallenge, challengeHashFn = opt_challengeHashFunction || encodedSha256, encodedSignChallenges = [];
    if (signChallenges) for (i = 0; i < signChallenges.length; i++) challenge = signChallenges[i], 
    keyHandle = challenge.keyHandle, challengeValue = challenge.hasOwnProperty("challenge") ? challenge.challenge : opt_defaultChallenge, 
    challengeHash = challengeHashFn(keyHandle, challengeValue), appId = challenge.hasOwnProperty("appId") ? challenge.appId : opt_defaultAppId, 
    encodedChallenge = {
        challengeHash: challengeHash,
        appIdHash: B64_encode(sha256HashOfString(appId)),
        keyHandle: keyHandle,
        version: challenge.version || "U2F_V1"
    }, encodedSignChallenges.push(encodedChallenge);
    return encodedSignChallenges;
}

function makeSignHelperRequest(challenges, opt_timeoutSeconds, opt_logMsgUrl) {
    var request = {
        type: "sign_helper_request",
        signData: challenges,
        timeout: opt_timeoutSeconds || 0,
        timeoutSeconds: opt_timeoutSeconds || 0
    };
    return void 0 !== opt_logMsgUrl && (request.logMsgUrl = opt_logMsgUrl), request;
}

function createSenderFromMessageSender(messageSender) {
    var sender, origin = getOriginFromUrl(messageSender.url);
    return origin ? (sender = {
        origin: origin
    }, messageSender.tlsChannelId && (sender.tlsChannelId = messageSender.tlsChannelId), 
    messageSender.tab && (sender.tabId = messageSender.tab.id), sender) : null;
}

function tabMatchesOrigin(tab, origin) {
    return getOriginFromUrl(tab.url) == origin ? Promise.resolve(tab.id) : Promise.reject(!1);
}

function WindowTimer() {}

function doEnrollRequest() {
    var challenge = window.crypto.getRandomValues(new Uint8Array(CHALLENGE_SIZE)), request = {
        type: MessageTypes.U2F_REGISTER_REQUEST,
        appId: window.location.origin,
        registerRequests: [ {
            version: U2F_VERSION,
            challenge: B64_encode(challenge)
        } ],
        registeredKeys: [],
        timeoutSeconds: 3e5,
        requestId: 1
    }, sender = {
        url: window.location.href
    };
    handleWebPageRequest(request, sender, function(response) {
        console.log("enroll responseCallback"), console.log(response);
    });
}

function doSignRequest() {
    var challenge = window.crypto.getRandomValues(new Uint8Array(CHALLENGE_SIZE)), request = {
        type: MessageTypes.U2F_SIGN_REQUEST,
        appId: window.location.origin,
        challenge: B64_encode(challenge),
        registeredKeys: [ {
            version: U2F_VERSION,
            keyHandle: "lol"
        } ],
        timeoutSeconds: 3e5,
        requestId: 1
    }, sender = {
        url: window.location.href
    };
    handleWebPageRequest(request, sender, function(response) {
        console.log("sign responseCallback"), console.log(response);
    });
}

var B64_inmap, MINIMUM_TIMEOUT_ATTENUATION_SECONDS, DEFAULT_REQUEST_TIMEOUT_SECONDS, EnrollChallenge, ErrorCodes, U2fError, RequestHandlerFactory, MessageTypes, gnubbySignRequestQueue, UTIL_ASN_INT, UTIL_ASN_SEQUENCE, UTIL_events, UTIL_max_events, JS_API_VERSION, UNUSED_CID_PUBKEY_VALUE, WebRequestSender, KEY_HANDLE_SIZE, CHALLENGE_SIZE, U2F_VERSION, ExtensionBridge, EXTENSION_BRIDGE, HTTP_ORIGINS_ALLOWED, BROWSER_SUPPORTS_TLS_CHANNEL_ID, FACTORY_REGISTRY, ExtensionPreprocessingJS;

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
    return appId ? 0 != appId.indexOf("http://") || this.allowHttp_ ? (origin = getOriginFromUrl(appId)) ? (p = this.fetcher_.fetch(appId), 
    self = this, p.then(getOriginsFromJson, function(rc_) {
        var rc = rc_;
        return console.log(UTIL_fmt("fetching " + appId + " failed: " + rc)), rc >= 400 && rc < 500 || self.timer_.expired() ? [] : self.fetchAllowedOriginsForAppId_(appId);
    })) : Promise.resolve([]) : (console.log(UTIL_fmt("http app ids disallowed, " + appId + " requested")), 
    Promise.resolve([])) : Promise.resolve([]);
}, XhrAppIdCheckerFactory.prototype.create = function() {
    return new XhrAppIdChecker(this.fetcher_);
}, B64_inmap = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 0, 0, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 0, 0, 0, 0, 64, 0, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 0, 0, 0, 0, 0 ], 
CountdownTimer.TIMER_INTERVAL_MILLIS = 200, CountdownTimer.prototype.setTimeout = function(timeoutMillis, cb) {
    return !this.timeoutId && (!(!timeoutMillis || timeoutMillis < 0) && (this.remainingMillis = timeoutMillis, 
    this.cb = cb, this.remainingMillis > CountdownTimer.TIMER_INTERVAL_MILLIS ? this.timeoutId = this.sysTimer_.setInterval(this.timerTick.bind(this), CountdownTimer.TIMER_INTERVAL_MILLIS) : this.timeoutId = this.sysTimer_.setTimeout(this.timerTick.bind(this), this.remainingMillis), 
    !0));
}, CountdownTimer.prototype.clearTimeout = function() {
    this.timeoutId && (this.sysTimer_.clearTimeout(this.timeoutId), this.timeoutId = void 0), 
    this.remainingMillis = 0;
}, CountdownTimer.prototype.millisecondsUntilExpired = function() {
    return this.remainingMillis > 0 ? this.remainingMillis : 0;
}, CountdownTimer.prototype.expired = function() {
    return this.remainingMillis <= 0;
}, CountdownTimer.prototype.clone = function(cb) {
    return new CountdownTimer(this.sysTimer_, this.remainingMillis, cb);
}, CountdownTimer.prototype.timerTick = function() {
    this.remainingMillis -= CountdownTimer.TIMER_INTERVAL_MILLIS, this.expired() && (this.sysTimer_.clearTimeout(this.timeoutId), 
    this.timeoutId = void 0, this.cb && this.cb());
}, CountdownTimerFactory.prototype.createTimer = function(timeoutMillis, opt_cb) {
    return new CountdownTimer(this.sysTimer_, timeoutMillis, opt_cb);
}, MINIMUM_TIMEOUT_ATTENUATION_SECONDS = 1, DEFAULT_REQUEST_TIMEOUT_SECONDS = 30, 
CryptoTokenApprovedOrigin.prototype.isApprovedOrigin = function(origin, opt_tabId) {
    return new Promise(function(resolve, reject) {
        resolve(!0);
    });
}, CryptoTokenOriginChecker.prototype.canClaimAppIds = function(origin, appIds) {
    var appIdChecks = appIds.map(this.checkAppId_.bind(this, origin));
    return Promise.all(appIdChecks).then(function(results) {
        return results.every(function(result) {
            return result;
        });
    });
}, CryptoTokenOriginChecker.prototype.checkAppId_ = function(origin, appId) {
    return new Promise(function(resolve, reject) {
        resolve(origin == appId);
    });
}, Enroller.DEFAULT_TIMEOUT_MILLIS = 3e4, Enroller.prototype.doEnroll = function(enrollChallenges, signChallenges, opt_appId) {
    this.enrollChallenges_ = enrollChallenges, this.signChallenges_ = signChallenges, 
    this.appId_ = opt_appId;
    var self = this;
    self.done_ || self.approveOrigin_();
}, Enroller.prototype.approveOrigin_ = function() {
    var self = this;
    FACTORY_REGISTRY.getApprovedOrigins().isApprovedOrigin(this.sender_.origin, this.sender_.tabId).then(function(result) {
        if (!self.done_) {
            if (!result) {
                if (self.timer_.expired()) return void self.notifyTimeout_();
                var newTimer = self.timer_.clone(self.notifyTimeout_.bind(self));
                return self.timer_.clearTimeout(), void (self.timer_ = newTimer);
            }
            self.sendEnrollRequestToHelper_();
        }
    });
}, Enroller.prototype.notifyTimeout_ = function() {
    this.notifyError_({
        errorCode: ErrorCodes.TIMEOUT
    });
}, Enroller.prototype.sendEnrollRequestToHelper_ = function() {
    var enrollAppIds, i, self, encodedEnrollChallenges = this.encodeEnrollChallenges_(this.enrollChallenges_, this.appId_), defaultSignChallenge = "", encodedSignChallenges = encodeSignChallenges(this.signChallenges_, defaultSignChallenge, this.appId_), request = {
        type: "enroll_helper_request",
        enrollChallenges: encodedEnrollChallenges,
        signData: encodedSignChallenges,
        logMsgUrl: this.logMsgUrl_
    };
    for (this.timer_.expired() || (request.timeout = this.timer_.millisecondsUntilExpired() / 1e3, 
    request.timeoutSeconds = this.timer_.millisecondsUntilExpired() / 1e3), enrollAppIds = [], 
    this.appId_ && enrollAppIds.push(this.appId_), i = 0; i < this.enrollChallenges_.length; i++) this.enrollChallenges_[i].hasOwnProperty("appId") && enrollAppIds.push(this.enrollChallenges_[i].appId);
    return enrollAppIds.length ? (self = this, void this.checkAppIds_(enrollAppIds, function(result) {
        if (!self.done_) if (result) if (self.handler_ = FACTORY_REGISTRY.getRequestHelper().getHandler(request), 
        self.handler_) {
            var helperComplete = self.helperComplete_.bind(self);
            self.handler_.run(helperComplete);
        } else self.notifyError_({
            errorCode: ErrorCodes.OTHER_ERROR
        }); else self.notifyError_({
            errorCode: ErrorCodes.BAD_REQUEST
        });
    })) : (console.warn(UTIL_fmt("empty enroll app ids?")), void this.notifyError_({
        errorCode: ErrorCodes.BAD_REQUEST
    }));
}, Enroller.encodeEnrollChallenge_ = function(enrollChallenge, opt_appId) {
    var version, appId, encodedChallenge = {};
    return version = enrollChallenge.version ? enrollChallenge.version : "U2F_V1", encodedChallenge.version = version, 
    encodedChallenge.challengeHash = enrollChallenge.challenge, appId = enrollChallenge.appId ? enrollChallenge.appId : opt_appId, 
    appId || console.warn(UTIL_fmt("No appId?")), encodedChallenge.appIdHash = B64_encode(sha256HashOfString(appId)), 
    encodedChallenge;
}, Enroller.prototype.encodeEnrollChallenges_ = function(enrollChallenges, opt_appId) {
    var i, enrollChallenge, version, modifiedChallenge, k, serverChallenge, browserData, challenges = [];
    for (i = 0; i < enrollChallenges.length; i++) if (enrollChallenge = enrollChallenges[i], 
    version = enrollChallenge.version, version || (version = "U2F_V1"), "U2F_V2" == version) {
        modifiedChallenge = {};
        for (k in enrollChallenge) modifiedChallenge[k] = enrollChallenge[k];
        serverChallenge = enrollChallenge.challenge, browserData = makeEnrollBrowserData(serverChallenge, this.sender_.origin, this.sender_.tlsChannelId), 
        modifiedChallenge.challenge = B64_encode(sha256HashOfString(browserData)), this.browserData_[version] = B64_encode(UTIL_StringToBytes(browserData)), 
        challenges.push(Enroller.encodeEnrollChallenge_(modifiedChallenge, opt_appId));
    } else challenges.push(Enroller.encodeEnrollChallenge_(enrollChallenge, opt_appId));
    return challenges;
}, Enroller.prototype.checkAppIds_ = function(enrollAppIds, cb) {
    var appIds = UTIL_unionArrays(enrollAppIds, getDistinctAppIds(this.signChallenges_));
    FACTORY_REGISTRY.getOriginChecker().canClaimAppIds(this.sender_.origin, appIds).then(this.originChecked_.bind(this, appIds, cb));
}, Enroller.prototype.originChecked_ = function(appIds, cb, result) {
    if (!result) return void this.notifyError_({
        errorCode: ErrorCodes.BAD_REQUEST
    });
    var appIdChecker = FACTORY_REGISTRY.getAppIdCheckerFactory().create();
    appIdChecker.checkAppIds(this.timer_.clone(), this.sender_.origin, appIds, this.allowHttp_, this.logMsgUrl_).then(cb);
}, Enroller.prototype.close = function() {
    this.handler_ && (this.handler_.close(), this.handler_ = null), this.done_ = !0;
}, Enroller.prototype.notifyError_ = function(error) {
    this.done_ || (this.close(), this.done_ = !0, this.errorCb_(error));
}, Enroller.prototype.notifySuccess_ = function(u2fVersion, info, opt_browserData) {
    this.done_ || (this.close(), this.done_ = !0, this.successCb_(u2fVersion, info, opt_browserData));
}, Enroller.prototype.helperComplete_ = function(reply) {
    var reportedError, browserData;
    reply.code ? (reportedError = mapDeviceStatusCodeToU2fError(reply.code), console.log(UTIL_fmt("helper reported " + reply.code.toString(16) + ", returning " + reportedError.errorCode)), 
    this.notifyError_(reportedError)) : (console.log(UTIL_fmt("Gnubby enrollment succeeded!!!!!")), 
    "U2F_V2" == reply.version && (browserData = this.browserData_[reply.version]), this.notifySuccess_(reply.version, reply.enrollData, browserData));
}, ErrorCodes = {
    OK: 0,
    OTHER_ERROR: 1,
    BAD_REQUEST: 2,
    CONFIGURATION_UNSUPPORTED: 3,
    DEVICE_INELIGIBLE: 4,
    TIMEOUT: 5
}, FactoryRegistry.prototype.getAppIdCheckerFactory = function() {
    return this.appIdCheckerFactory_;
}, FactoryRegistry.prototype.getApprovedOrigins = function() {
    return this.approvedOrigins_;
}, FactoryRegistry.prototype.getCountdownFactory = function() {
    return this.countdownFactory_;
}, FactoryRegistry.prototype.getOriginChecker = function() {
    return this.originChecker_;
}, FactoryRegistry.prototype.getRequestHelper = function() {
    return this.requestHelper_;
}, FactoryRegistry.prototype.getSystemTimer = function() {
    return this.sysTimer_;
}, FactoryRegistry.prototype.getTextFetcher = function() {
    return this.textFetcher_;
}, GenericRequestHelper.prototype.getHandler = function(request) {
    return this.handlerFactories_.hasOwnProperty(request.type) ? this.handlerFactories_[request.type](request) : null;
}, GenericRequestHelper.prototype.registerHandlerFactory = function(type, factory) {
    this.handlerFactories_[type] = factory;
}, MessageTypes = {
    U2F_REGISTER_REQUEST: "u2f_register_request",
    U2F_SIGN_REQUEST: "u2f_sign_request",
    U2F_REGISTER_RESPONSE: "u2f_register_response",
    U2F_SIGN_RESPONSE: "u2f_sign_response",
    U2F_GET_API_VERSION_REQUEST: "u2f_get_api_version_request",
    U2F_GET_API_VERSION_RESPONSE: "u2f_get_api_version_response"
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
}, QueuedSignRequest.prototype.close = function() {
    if (!this.closed_) {
        var hadBegunSigning = !1;
        this.begun_ && this.signer_ && (this.signer_.close(), hadBegunSigning = !0), this.token_ && (hadBegunSigning ? console.log(UTIL_fmt("closing in-progress request")) : console.log(UTIL_fmt("closing timed-out request before processing")), 
        this.token_.complete()), this.closed_ = !0;
    }
}, QueuedSignRequest.prototype.setToken = function(token) {
    this.token_ = token;
}, QueuedSignRequest.prototype.begin = function(token) {
    return this.timer_.expired() ? (console.log(UTIL_fmt("Queued request begun after timeout")), 
    this.close(), void this.errorCb_({
        errorCode: ErrorCodes.TIMEOUT
    })) : (this.begun_ = !0, this.setToken(token), this.signer_ = new Signer(this.timer_, this.sender_, this.signerFailed_.bind(this), this.signerSucceeded_.bind(this), this.logMsgUrl_), 
    this.signer_.setChallenges(this.signChallenges_, this.defaultChallenge_, this.appId_) || (token.complete(), 
    this.errorCb_({
        errorCode: ErrorCodes.BAD_REQUEST
    })), void this.timer_.clearTimeout());
}, QueuedSignRequest.prototype.signerFailed_ = function(error) {
    this.token_.complete(), this.errorCb_(error);
}, QueuedSignRequest.prototype.signerSucceeded_ = function(challenge, info, browserData) {
    this.token_.complete(), this.successCb_(challenge, info, browserData);
}, Signer.prototype.setChallenges = function(signChallenges, opt_defaultChallenge, opt_appId) {
    return !this.challengesSet_ && !this.done_ && (this.timer_.expired() ? (this.notifyError_({
        errorCode: ErrorCodes.TIMEOUT
    }), !0) : (this.signChallenges_ = signChallenges, this.defaultChallenge_ = opt_defaultChallenge, 
    this.appId_ = opt_appId, this.challengesSet_ = !0, this.checkAppIds_(), !0));
}, Signer.prototype.checkAppIds_ = function() {
    var error, appIds = getDistinctAppIds(this.signChallenges_);
    return this.appId_ && (appIds = UTIL_unionArrays([ this.appId_ ], appIds)), appIds && appIds.length ? void FACTORY_REGISTRY.getOriginChecker().canClaimAppIds(this.sender_.origin, appIds).then(this.originChecked_.bind(this, appIds)) : (error = {
        errorCode: ErrorCodes.BAD_REQUEST,
        errorMessage: "missing appId"
    }, void this.notifyError_(error));
}, Signer.prototype.originChecked_ = function(appIds, result) {
    var error, appIdChecker;
    return result ? (appIdChecker = FACTORY_REGISTRY.getAppIdCheckerFactory().create(), 
    void appIdChecker.checkAppIds(this.timer_.clone(), this.sender_.origin, appIds, this.allowHttp_, this.logMsgUrl_).then(this.appIdChecked_.bind(this))) : (error = {
        errorCode: ErrorCodes.BAD_REQUEST,
        errorMessage: "bad appId"
    }, void this.notifyError_(error));
}, Signer.prototype.appIdChecked_ = function(result) {
    if (!result) {
        var error = {
            errorCode: ErrorCodes.BAD_REQUEST,
            errorMessage: "bad appId"
        };
        return void this.notifyError_(error);
    }
    if (!this.doSign_()) return void this.notifyError_({
        errorCode: ErrorCodes.BAD_REQUEST
    });
}, Signer.prototype.doSign_ = function() {
    var i, challenge, serverChallenge, keyHandle, browserData, encodedChallenges, timeoutSeconds, request;
    for (i = 0; i < this.signChallenges_.length; i++) {
        if (challenge = this.signChallenges_[i], serverChallenge = challenge.hasOwnProperty("challenge") ? challenge.challenge : this.defaultChallenge_, 
        !serverChallenge) return console.warn(UTIL_fmt("challenge missing")), !1;
        keyHandle = challenge.keyHandle, browserData = makeSignBrowserData(serverChallenge, this.sender_.origin, this.sender_.tlsChannelId), 
        this.browserData_[keyHandle] = browserData, this.serverChallenges_[keyHandle] = challenge;
    }
    return encodedChallenges = encodeSignChallenges(this.signChallenges_, this.defaultChallenge_, this.appId_, this.getChallengeHash_.bind(this)), 
    timeoutSeconds = this.timer_.millisecondsUntilExpired() / 1e3, request = makeSignHelperRequest(encodedChallenges, timeoutSeconds, this.logMsgUrl_), 
    this.handler_ = FACTORY_REGISTRY.getRequestHelper().getHandler(request), !!this.handler_ && this.handler_.run(this.helperComplete_.bind(this));
}, Signer.prototype.getChallengeHash_ = function(keyHandle, challenge) {
    return B64_encode(sha256HashOfString(this.browserData_[keyHandle]));
}, Signer.prototype.close = function() {
    this.close_();
}, Signer.prototype.close_ = function(opt_notifying) {
    this.handler_ && (this.handler_.close(), this.handler_ = null), this.timer_.clearTimeout(), 
    opt_notifying || this.notifyError_({
        errorCode: ErrorCodes.TIMEOUT
    });
}, Signer.prototype.notifyError_ = function(error) {
    this.done_ || (this.done_ = !0, this.close_(!0), this.errorCb_(error));
}, Signer.prototype.notifySuccess_ = function(challenge, info, browserData) {
    this.done_ || (this.done_ = !0, this.close_(!0), this.successCb_(challenge, info, browserData));
}, Signer.prototype.helperComplete_ = function(helperReply, opt_source) {
    var reply, reportedError, logMsg, key, browserData, serverChallenge;
    return "sign_helper_reply" != helperReply.type ? void this.notifyError_({
        errorCode: ErrorCodes.OTHER_ERROR
    }) : (reply = helperReply, void (reply.code ? (reportedError = mapDeviceStatusCodeToU2fError(reply.code), 
    console.log(UTIL_fmt("helper reported " + reply.code.toString(16) + ", returning " + reportedError.errorCode)), 
    this.notifyError_(reportedError)) : (this.logMsgUrl_ && opt_source && (logMsg = "signed&source=" + opt_source, 
    logMessage(logMsg, this.logMsgUrl_)), key = reply.responseData.keyHandle, browserData = this.browserData_[key], 
    serverChallenge = this.serverChallenges_[key], this.notifySuccess_(serverChallenge, reply.responseData.signatureData, browserData))));
}, TextFetcher.prototype.fetch = function(url, opt_method, opt_body) {}, XhrTextFetcher.prototype.fetch = function(url, opt_method, opt_body) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest(), method = opt_method || "GET";
        xhr.open(method, url, !0), xhr.onloadend = function() {
            return 200 != xhr.status ? void reject(xhr.status) : void resolve(xhr.responseText);
        }, xhr.onerror = function() {
            reject(404);
        }, opt_body ? xhr.send(opt_body) : xhr.send();
    });
}, UTIL_ASN_INT = 2, UTIL_ASN_SEQUENCE = 48, UTIL_events = [], UTIL_max_events = 500, 
WatchdogRequestHandler.prototype.wrapCallback = function(cb) {
    return this.wrappedCallback_.bind(this, cb);
}, WatchdogRequestHandler.prototype.close = function() {
    this.closed_ = !0, this.timer_.clearTimeout(), this.closeable_ && (this.closeable_.close(), 
    this.closeable_ = void 0);
}, WatchdogRequestHandler.prototype.setCloseable = function(closeable) {
    this.closeable_ = closeable;
}, WatchdogRequestHandler.prototype.timeout_ = function() {
    if (!this.calledBack_ && !this.closed_) {
        var logMsg = "Not called back within " + this.timeoutValueSeconds_ + " second timeout";
        this.timeoutCb_ ? (logMsg += ", calling default callback", console.warn(UTIL_fmt(logMsg)), 
        this.timeoutCb_()) : console.warn(UTIL_fmt(logMsg));
    }
}, WatchdogRequestHandler.prototype.wrappedCallback_ = function(cb, var_args) {
    if (!this.closed_) {
        this.calledBack_ = !0, this.timer_.clearTimeout();
        var originalArgs = Array.prototype.slice.call(arguments, 1);
        cb.apply(null, originalArgs);
    }
}, JS_API_VERSION = 1.1, UNUSED_CID_PUBKEY_VALUE = "unused", WindowTimer.prototype.setTimeout = function(func, timeoutMillis) {
    return window.setTimeout(func, timeoutMillis);
}, WindowTimer.prototype.clearTimeout = function(timeoutId) {
    window.clearTimeout(timeoutId);
}, WindowTimer.prototype.setInterval = function(func, timeoutMillis) {
    return window.setInterval(func, timeoutMillis);
}, WindowTimer.prototype.clearInterval = function(timeoutId) {
    window.clearInterval(timeoutId);
}, KEY_HANDLE_SIZE = 32, CHALLENGE_SIZE = 32, U2F_VERSION = "U2F_V2", ExtensionBridge = function() {
    this.stack = [], this.extensionCallbacks = [];
}, ExtensionBridge.prototype = {
    queue: function(data, cb) {
        console.log("ExtensionBridge.queue"), this.stack.push({
            data: data,
            cb: cb
        }), this.startTransaction();
    },
    run: function(parameters) {
        console.log("ExtensionBridge.run"), this.extensionCallbacks.push(parameters.completionFunction), 
        this.startTransaction();
    },
    startTransaction: function() {
        console.log("ExtensionBridge.startTransaction"), this.stack.length > 0 && this.extensionCallbacks.length > 0 && this.extensionCallbacks.pop()(this.stack[0].data);
    },
    finalize: function(parameters) {
        console.log("ExtensionBridge.finalize"), this.stack.length > 0 && this.stack.pop().cb(parameters);
    }
}, EXTENSION_BRIDGE = new ExtensionBridge(), HTTP_ORIGINS_ALLOWED = !0, BROWSER_SUPPORTS_TLS_CHANNEL_ID = !1, 
FACTORY_REGISTRY = function() {
    var windowTimer = new WindowTimer(), xhrTextFetcher = new XhrTextFetcher();
    return new FactoryRegistry(new XhrAppIdCheckerFactory(xhrTextFetcher), new CryptoTokenApprovedOrigin(), new CountdownTimerFactory(windowTimer), new CryptoTokenOriginChecker(), new GenericRequestHelper(), windowTimer, xhrTextFetcher);
}(), FACTORY_REGISTRY.getRequestHelper().registerHandlerFactory("enroll_helper_request", function(request) {
    return {
        run: function(enrollCB) {
            var enrollChallenge = request.enrollChallenges[0], keyHandle = Array.from(window.crypto.getRandomValues(new Uint8Array(KEY_HANDLE_SIZE))), toSign = [ 0 ].concat(B64_decode(enrollChallenge.appIdHash), B64_decode(enrollChallenge.challengeHash), keyHandle), enrollParams = {
                appId: enrollChallenge.appIdHash,
                toSign: JSON.stringify(toSign)
            };
            EXTENSION_BRIDGE.queue(enrollParams, function(data) {
                var responseData = [ 5 ].concat(UTIL_StringToBytes(data.publicKey), KEY_HANDLE_SIZE, keyHandle, UTIL_StringToBytes(data.certificate), UTIL_StringToBytes(data.signature));
                enrollCB({
                    version: U2F_VERSION,
                    enrollData: B64_encode(responseData)
                });
            });
        },
        close: function() {}
    };
}), FACTORY_REGISTRY.getRequestHelper().registerHandlerFactory("sign_helper_request", function(request) {
    return {
        run: function(signCB) {
            console.log("sign_helper_request.run"), console.log(request);
        },
        close: function() {}
    };
}), ExtensionPreprocessingJS = EXTENSION_BRIDGE;
