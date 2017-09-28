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
      var plz = session.userData.plz,
        wohnflaeche = session.userData.wohnflaeche;
      dialog_modules.calculateHrTarif(plz, wohnflaeche, "B").then(function(basis) {
        dialog_modules.calculateHrTarif(plz, wohnflaeche, "C").then(function (comfort) {
          session.send(
            "OK, Danke ... hier kommt die Berechnung\n" +
            //"Daten: PLZ "+ session.userData.plz +" Wohnfläche "+ session.userData.wohnflaeche +"\n"+
            "Basis: " + basis + "\n" +
            "Comfort: " + comfort
            // getCalculationResponse
          );
        })
      });
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
