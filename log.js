// der MIST funktioniert nicht wie geplant
// todo: logging funktion fertigstellen

// This loads the environment variables from the .env file
require('dotenv-extended').load();

var debug_state = (process.env.DEBUG || false);

exports.log_event = function(text){
    var timestamp = function(){};
    timestamp.toString = function(){
        return "[" + (new Date).toLocaleTimeString() + "] ";
    };
    console.log("DEBUG: " + process.env.DEBUG);
    console.log("debug_state: " + debug_state);
    console.log("timestamp: " + timestamp);
    console.log("text: " + text);
    if (debug_state===true) {
        console.log(timestamp, text);
    }
};
