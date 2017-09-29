// This loads the environment variables from the .env file
require('dotenv-extended').load();

var restify = require('restify');
var builder = require('botbuilder');
var dialog_modules = require('./dialog_modules');
var dialog_messages = require('./dialog_msg').msg;

// Test-Kommentar für Testpush

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('Bot hört auf: %s', server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
//console.log('MICROSOFT_APP_ID: %s', process.env.MICROSOFT_APP_ID);
//console.log('MICROSOFT_APP_PASSWORD: %s', process.env.MICROSOFT_APP_PASSWORD);

// Listen for messages from users
server.post('/api/messages', connector.listen());

var default_waterfall_handler = function(callback){
    return function(session, results){
        if (results.response) {
            callback(session, results);
        } else {
            session.send(dialog_messages['user-abort']);
        }
    }
};

var service_error_handler = function(session){
    return function(responseObj){
        session.send( dialog_messages["service-error-occurred"] );
        console.log(responseObj);
        if (responseObj.hasOwnProperty("fehlerText")){
            session.send(responseObj["fehlerText"].split(";")[1])
        }
    }
};

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.beginDialog('hr_question_plz', {});
        //session.send( dialog_modules.exampleCards(session) );
    },
    default_waterfall_handler(function (session, results){
        //session.send("OK, Danke");
        session.beginDialog('hr_question_wohnflaeche', {});
    }),
    default_waterfall_handler(function (session, results){
        session.send(
            "OK, Danke ... Einen kurzen Moment, bitte, ich rechne ...\n"
            //"Daten: PLZ "+ session.userData.plz +" Wohnfläche "+ session.userData.wohnflaeche +"\n"+
        );
        var plz = session.userData.plz,
            wohnflaeche = session.userData.wohnflaeche;
        dialog_modules.calculateHrTarif(plz, wohnflaeche, "B").then(function(calcResponseBasis) {
            dialog_modules.calculateHrTarif(plz, wohnflaeche, "C").then(function(calcResponseComfort) {
                session.send(
                    "Basis: " + calcResponseBasis["beitragHv"] + "\n" +
                    "Comfort: " + calcResponseComfort["beitragHv"]
                    // getCalculationResponse
                );
            },service_error_handler(session))
        },service_error_handler(session));
    })
]);

/*
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded && message.membersAdded.length > 0) {
        var membersAdded = message.membersAdded
            .map(function (m) {
                var isSelf = m.id === message.address.bot.id;
                return (isSelf ? message.address.bot.name : m.name) || '' + ' (Id: ' + m.id + ')';
            })
            .join(', ');

        if (membersAdded == "User") {
            bot.send(
                new builder.Message()
                .address(message.address)
                .text( dialog_messages["welcome"] ) // 'Welcome ' + membersAdded
            );
        }
    }
});
*/


bot.dialog('hr_question_plz', dialog_modules.hrQuestionsDialog['plz']);
bot.dialog('hr_question_wohnflaeche', dialog_modules.hrQuestionsDialog['wohnflaeche']);
