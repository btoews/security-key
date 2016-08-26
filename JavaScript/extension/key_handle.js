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
