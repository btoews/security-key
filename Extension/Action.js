var Action = function() {};

Action.prototype = {
    run: function(parameters) {
        parameters.completionFunction({origin: window.location.origin, message: "hello, world!" });
    },
        
    finalize: function(parameters) {
    }
};

var ExtensionPreprocessingJS = new Action;