// Copyright (c) 2016 GitHub, inc.

function validAppId(appId) {
  var timer = new Timer(30);
  var textFetcher = new XhrTextFetcher();
  var xhrAppIdCheckerFactory = new XhrAppIdCheckerFactory(textFetcher);
  var appIdChecker = xhrAppIdCheckerFactory.create();

  return appIdChecker.checkAppIds(
    timer,
    window.location.origin,
    [appId],
    true // allow-http
  ).then(function(valid) {
    if(!valid) {
      throw new Error('invalid app id for origin');
    }
  });
};
