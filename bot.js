// This loads the environment variables from the .env file
require('dotenv-extended').load();

var restify = require('restify');
var builder = require('botbuilder');
var dialog_modules = require('./dialog_modules');

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


// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, [
    function (session) {
        //session.beginDialog('meaningOfLife', {});
        session.send( dialog_modules.exampleCards(session) );
    }/*,
    function (session, results) {
        // Check their answer
        if (results.response) {
            session.send("That's correct! You are wise beyond your years...");
        } else {
            session.send("Sorry you couldn't figure it out. Everyone knows that the meaning of life is 42.");
        }
    }*/
]);

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded && message.membersAdded.length > 0) {
        var membersAdded = message.membersAdded
            .map(function (m) {
                var isSelf = m.id === message.address.bot.id;
                return (isSelf ? message.address.bot.name : m.name) || '' + ' (Id: ' + m.id + ')';
            })
            .join(', ');

        if (membersAdded == "User") {
            bot.send(new builder.Message()
                .address(message.address)
                .text('Welcome ' + membersAdded));
        }
    }
});


bot.dialog('meaningOfLife', dialog_modules.meaningOfLifeDialog);

/*
// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
  bot.set('persistConversationData', true);

  var msg = session.message;
  //if (initial == 0) {

  if (false && !username) {
    session.beginDialog('greetings');
  } else if (msg.attachments && msg.attachments.length > 0) {
    // Echo back attachment
    session.send( dialog_modules.echo_attachment(session) );
  } else {
      //session.send("echo: %s", session.message.text);
      session.send( dialog_modules.echo(session) );
  }
});
*/



/*
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
*/
