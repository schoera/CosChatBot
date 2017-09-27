// This loads the environment variables from the .env file
require('dotenv-extended').load();

var restify = require('restify');
var builder = require('botbuilder');
var zitate = require('./zitate');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3979, function () {
   console.log('Bot hört auf: %s', server.url);
});

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min +1)) + min; 
}

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
//console.log('MICROSOFT_APP_ID: %s', process.env.MICROSOFT_APP_ID);
//console.log('MICROSOFT_APP_PASSWORD: %s', process.env.MICROSOFT_APP_PASSWORD);

// Listen for messages from users
server.post('/api/messages', connector.listen());

var username;

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
  bot.set('persistConversationData', true);
  
  var msg = session.message;
  //if (initial == 0) {
  if (!username) {
    session.beginDialog('greetings');
  }  
  else if (msg.attachments && msg.attachments.length > 0) {
    // Echo back attachment
    var attachment = msg.attachments[0];
    session.send({
      text: "Bud sagt: ",
      attachments: [
        {
          contentType: attachment.contentType,
          contentUrl: attachment.contentUrl,
          name: attachment.name
        }
      ]
    });
  } else {
    // Echo back users text
    if(session.message.text=="!spruch") {
      session.send(zitate.zitate[getRandomIntInclusive(0,10)]);
    }
    else {    
      session.send("Bud sagt: %s", session.message.text);
    }
  }
});

// Ask the user for their name and greet them by name.
bot.dialog('greetings', [
    function (session) {
        session.beginDialog('askName');
    },
    function (session, results) {
        session.endDialog(`Hallo ${results.response}, folgende Befehle stehen dir zur Verfügung: !spruch`);
    }
]);
bot.dialog('askName', [
    function (session) {
        builder.Prompts.text(session, 'Hallo unbekannter Nutzer, der Budbot begrüßt dich. Verrätst du mir deinen Namen?');
    },
    function (session, results) {
        session.endDialogWithResult(results);
        username = results.response;
    }
]);
