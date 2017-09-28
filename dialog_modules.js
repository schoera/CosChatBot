
var builder = require('botbuilder');
var dialog_messages = require('./dialog_msg').msg;
var restify = require('restify-clients');

var restClient = restify.createJsonClient({
  //url: 'http://15c6931e.ngrok.io',
  url: 'http://nb767.cosmos.local:8087',
  version: '*'
});




exports.echo = function(session){
    return "echo: "+ session.message.text
};

exports.echo_attachment = function(session){
    var attachment = session.message.attachments[0];
    return {
        text: "echo: ",
        attachments: [
          {
            contentType: attachment.contentType,
            contentUrl: attachment.contentUrl,
            name: attachment.name
          }
        ]
    }
};

abortMatcher = function(){
    return /(give up|quit|skip|yes|abbruch|abbrechen)/i
}

exports.hrQuestionsDialog = {
    /// HR PLZ Frage
    'plz': new builder.IntentDialog()
        .onBegin(function (session, args) {
            // Save args passed to prompt
            // session.dialogData.retryPrompt = args.retryPrompt || dialog_messages["unclear-user-response"];
            // Send initial prompt
            // - This isn't a waterfall so you shouldn't call any of the built-in Prompts.
            session.send( dialog_messages["hr-question-plz"] );
        })
        .matches(abortMatcher(), function (session) {
            // Return 'false' to indicate they gave up
            session.endDialogWithResult({ response: false });
        })
        .matches(/\d{5}/i, function (session) {
            // Return 'false' to indicate they gave up
            session.userData.plz = session.message.text.match(/(\d{5})/)[0];
            session.save();
            session.endDialogWithResult({ response: true });
        })
        .onDefault(function (session) {
            // Validate users reply.
            //if (session.message.text == '42') {
                // Return 'true' to indicate success
            //    session.endDialogWithResult({ response: true });
            //} else {
                // Re-prompt user
                //session.send(session.dialogData.retryPrompt);
                session.send(
                    dialog_messages["unclear-user-response"] +
                    dialog_messages["invalid-response-plz"]
                );
            //}
        }),

    /// HR Wohnfläche Frage
    'wohnflaeche': new builder.IntentDialog()
        .onBegin(function (session, args) {
            // Save args passed to prompt
            // session.dialogData.retryPrompt = args.retryPrompt || dialog_messages["unclear-user-response"];
            // Send initial prompt
            // - This isn't a waterfall so you shouldn't call any of the built-in Prompts.
            session.send( dialog_messages["hr-question-wohnflaeche"] );
        })
        .matches(abortMatcher(), function (session) {
            // Return 'false' to indicate they gave up
            session.endDialogWithResult({ response: false });
        })
        .matches(/\d+/i, function (session) {
            // Return 'false' to indicate they gave up
            session.userData.wohnflaeche = session.message.text.match(/(\d+)/)[0];
            session.save();
            session.endDialogWithResult({ response: true });
        })
        .onDefault(function (session) {
            // Validate users reply.
            //if (session.message.text == '42') {
                // Return 'true' to indicate success
            //    session.endDialogWithResult({ response: true });
            //} else {
                // Re-prompt user
                //session.send(session.dialogData.retryPrompt);
                session.send( dialog_messages["unclear-user-response"] );
            //}
        }),

}

exports.calculateHrTarif = function(plz, wohnflaeche, tarif){
  console.log("--------------calculateHrTarif--------------------")
  jsonObject = JSON.parse('{"tarifHv" : "' + tarif + '", "selbstbeteiligung" : true, "wohnflaeche" : ' + wohnflaeche + ', "glasversicherung" : true, "hrPlz" : ' + plz + '}');
  restClient.post('/hausratRechnen', jsonObject, function(err, req, res, obj) {
    //assert.ifError(err);
    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    console.log('%d -> %j', res.statusCode, res.headers);
    console.log('%j', obj);
    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
  });


}

/*exports.getRestData = function (stream) {
  return new Promise(
    function (resolve, reject) {
      var requestData = {
        url: 'http://15c6931e.ngrok.io/hausratRechnen',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      request.post(requestData, function (error, response, body) {
        if (error) {
          reject(error);
        }
        else if (response.statusCode !== 200) {
          reject(body);
        }
        else {
          resolve(JSON.parse(body).visuallySimilarProducts);
        }
      });
    }
  );
};  */

/*exports.calculateHrTarif = function(plz, wohnflaeche, tarif){
  /*
   {"tarifHv" : "C", "selbstbeteiligung" : true,"wohnflaeche" : 150,"glasversicherung" : true,"hrPlz" : 66822}
   http://nb767.cosmos.local:8087/hausratRechnen
   http://15c6931e.ngrok.io/hausratRechnen
   */
  // Sending and receiving data in JSON format using POST method
  /*var xhr = new XMLHttpRequest();
  var url = "http://15c6931e.ngrok.io/hausratRechnen";
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var json = JSON.parse(xhr.responseText);
      console.log(json);
    }
  };
  var data = JSON.stringify('{"tarifHv" : "' + tarif + '", "selbstbeteiligung" : true, "wohnflaeche" : ' + wohnflaeche + ', "glasversicherung" : true, "hrPlz" : ' + plz + '}');
  xhr.send(data);
}    */



/** EXAMPLES **/


exports.meaningOfLifeDialog = new builder.IntentDialog()
    .onBegin(function (session, args) {
        // Save args passed to prompt
        session.dialogData.retryPrompt = args.retryPrompt || "Sorry that's incorrect. Guess again. Or do you give up?";

        // Send initial prompt
        // - This isn't a waterfall so you shouldn't call any of the built-in Prompts.
        session.send(args.prompt || "What's the meaning of life?");
    })
    .matches(/(give up|quit|skip|yes)/i, function (session) {
        // Return 'false' to indicate they gave up
        session.endDialogWithResult({ response: false });
    })
    .onDefault(function (session) {
        // Validate users reply.
        if (session.message.text == '42') {
            // Return 'true' to indicate success
            session.endDialogWithResult({ response: true });
        } else {
            // Re-prompt user
            session.send(session.dialogData.retryPrompt);
        }
    });

exports.exampleCards = function(session){
    var exampleCards = {
        "hero1": new builder.HeroCard(session)
            .title('Azure Storage')
            .subtitle('Offload the heavy lifting of data center management')
            .text('Store and help protect your data. Get durable, highly available data storage across the globe and pay only for what you use.')
            .images([
                builder.CardImage.create(session, 'https://docs.microsoft.com/en-us/azure/storage/media/storage-introduction/storage-concepts.png')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/services/storage/', 'Learn More')
            ]),

        "thumb1": new builder.ThumbnailCard(session)
            .title('DocumentDB')
            .subtitle('Blazing fast, planet-scale NoSQL')
            .text('NoSQL service for highly available, globally distributed apps—take full advantage of SQL and JavaScript over document and key-value data without the hassles of on-premises or virtual machine-based cloud database options.')
            .images([
                builder.CardImage.create(session, 'https://docs.microsoft.com/en-us/azure/documentdb/media/documentdb-introduction/json-database-resources1.png')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/services/documentdb/', 'Learn More')
            ]),

        "hero2": new builder.HeroCard(session)
            .title('Azure Functions')
            .subtitle('Process events with a serverless code architecture')
            .text('An event-based serverless compute experience to accelerate your development. It can scale based on demand and you pay only for the resources you consume.')
            .images([
                builder.CardImage.create(session, 'https://azurecomcdn.azureedge.net/cvt-5daae9212bb433ad0510fbfbff44121ac7c759adc284d7a43d60dbbf2358a07a/images/page/services/functions/01-develop.png')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/services/functions/', 'Learn More')
            ]),

        "thumb2": new builder.ThumbnailCard(session)
            .title('Cognitive Services')
            .subtitle('Build powerful intelligence into your applications to enable natural and contextual interactions')
            .text('Enable natural and contextual interaction with tools that augment users\' experiences using the power of machine-based intelligence. Tap into an ever-growing collection of powerful artificial intelligence algorithms for vision, speech, language, and knowledge.')
            .images([
                builder.CardImage.create(session, 'https://azurecomcdn.azureedge.net/cvt-68b530dac63f0ccae8466a2610289af04bdc67ee0bfbc2d5e526b8efd10af05a/images/page/services/cognitive-services/cognitive-services.png')
            ])
            .buttons([
                builder.CardAction.openUrl(session, 'https://azure.microsoft.com/en-us/services/cognitive-services/', 'Learn More')
            ])
    };
    return new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments([
            exampleCards['hero1'],
            exampleCards['hero2'],
            exampleCards['thumb1'],
            exampleCards['thumb2'],
        ]);
}

// session.send( dialog_modules.exampleCards(session) );
