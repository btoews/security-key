var Action = function() {};

Action.prototype = {
    run: function(parameters) {
        parameters.completionFunction({origin: window.location.origin, message: "hello, world!" });
    },
        
    finalize: function(parameters) {
        document.body.innerText = JSON.stringify(parameters);
    }
};

var ExtensionPreprocessingJS = new Action;




//
// The following is all from Chromium
//

// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Response status codes
 * @const
 * @enum {number}
 */
var ErrorCodes = {
    'OK': 0,
    'OTHER_ERROR': 1,
    'BAD_REQUEST': 2,
    'CONFIGURATION_UNSUPPORTED': 3,
    'DEVICE_INELIGIBLE': 4,
    'TIMEOUT': 5
};

/**
 * An error object for responses
 * @typedef {{
 *   errorCode: ErrorCodes,
 *   errorMessage: (?string|undefined)
 * }}
 */
var U2fError;

/**
 * Message types for messsages to/from the extension
 * @const
 * @enum {string}
 */
var MessageTypes = {
U2F_REGISTER_REQUEST: 'u2f_register_request',
U2F_SIGN_REQUEST: 'u2f_sign_request',
U2F_REGISTER_RESPONSE: 'u2f_register_response',
U2F_SIGN_RESPONSE: 'u2f_sign_response',
U2F_GET_API_VERSION_REQUEST: 'u2f_get_api_version_request',
U2F_GET_API_VERSION_RESPONSE: 'u2f_get_api_version_response'
};

/**
 * FIDO U2F Javascript API Version
 * @const
 * @type {number}
 */
var JS_API_VERSION = 1.1;

/**
 * @param {Object} request Request object
 * @param {MessageSender} sender Sender frame
 * @param {Function} sendResponse Response callback
 * @return {?Closeable} Optional handler object that should be closed when port
 *     closes
 */
function handleWebPageRequest(request, sender, sendResponse) {
    switch (request.type) {
        case MessageTypes.U2F_REGISTER_REQUEST:
            return handleU2fEnrollRequest(sender, request, sendResponse);
            
        case MessageTypes.U2F_SIGN_REQUEST:
            return handleU2fSignRequest(sender, request, sendResponse);
            
        case MessageTypes.U2F_GET_API_VERSION_REQUEST:
            sendResponse(
                         makeU2fGetApiVersionResponse(request, JS_API_VERSION,
                                                      MessageTypes.U2F_GET_API_VERSION_RESPONSE));
            return null;
            
        default:
            sendResponse(
                         makeU2fErrorResponse(request, ErrorCodes.BAD_REQUEST, undefined,
                                              MessageTypes.U2F_REGISTER_RESPONSE));
            return null;
    }
}

/**
 * Makes a response to a U2F request with an error code.
 * @param {Object} request The request to make a response to.
 * @param {number=} version The JS API version to return.
 * @param {string=} opt_defaultType The default response type, if none is
 *     present in the request.
 * @return {Object} The GetJsApiVersionResponse.
 */
function makeU2fGetApiVersionResponse(request, version, opt_defaultType) {
    var reply = makeResponseForRequest(request, '_response', opt_defaultType);
    var data = {'js_api_version': version};
    reply['responseData'] = data;
    return reply;
}

/**
 * Makes a response to a U2F request with an error code.
 * @param {Object} request The request to make a response to.
 * @param {ErrorCodes} code The error code to return.
 * @param {string=} opt_detail An error detail string.
 * @param {string=} opt_defaultType The default response type, if none is
 *     present in the request.
 * @return {Object} The U2F error.
 */
function makeU2fErrorResponse(request, code, opt_detail, opt_defaultType) {
    var reply = makeResponseForRequest(request, '_response', opt_defaultType);
    var error = {'errorCode': code};
    if (opt_detail) {
        error['errorMessage'] = opt_detail;
    }
    reply['responseData'] = error;
    return reply;
}

/**
 * Makes a response to a request.
 * @param {Object} request The request to make a response to.
 * @param {string} responseSuffix How to name the response's type.
 * @param {string=} opt_defaultType The default response type, if none is
 *     present in the request.
 * @return {Object} The response object.
 */
function makeResponseForRequest(request, responseSuffix, opt_defaultType) {
    var type;
    if (request && request.type) {
        type = request.type.replace(/_request$/, responseSuffix);
    } else {
        type = opt_defaultType;
    }
    var reply = { 'type': type };
    if (request && request.requestId) {
        reply.requestId = request.requestId;
    }
    return reply;
}