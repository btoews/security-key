var Action = function() {};

Action.prototype = {
    run: function(parameters) {
      console.log("Action.run");
      console.log(parameters);
        parameters.completionFunction({origin: window.location.origin, message: "hello, world!" });
    },

    finalize: function(parameters) {
        console.log("Action.finalize");
        console.log(parameters);
    }
};

var ExtensionPreprocessingJS = new Action;
