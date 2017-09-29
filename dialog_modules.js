// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');
var dialog_messages = require('./dialog_msg').msg;
var restify = require('restify-clients');
var log = require('./log');
var calculation_service_url_internal = "http://nb767.cosmos.local:8087";
var calculation_service_url_external = "https://15c6931e.ngrok.io";
var calculation_service_url = (process.env.INTERNAL_CALL || false) ? calculation_service_url_internal : calculation_service_url_external;

var restClient = restify.createJsonClient({
  url: calculation_service_url,
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
};

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
            // umwandeln in integer
            session.userData.wohnflaeche = session.userData.wohnflaeche*1;
            if((session.userData.wohnflaeche < 24) || (session.userData.wohnflaeche > 193)) {
              session.send(dialog_messages["invalid-response-wohnflaeche"] );
            }
            else {
              session.save();
              session.endDialogWithResult({ response: true });
            }
        })
        .onDefault(function (session) {
            // Validate users reply.
            //if (session.message.text == '42') {
                // Return 'true' to indicate success
            //    session.endDialogWithResult({ response: true });
            //} else {
                // Re-prompt user
                //session.send(session.dialogData.retryPrompt);
                session.send(dialog_messages["unclear-user-response"] );
            //}
        })

};

exports.calculateHrTarif = function(plz, wohnflaeche, tarif){
    var jsonObject = JSON.parse('{"tarifHv" : "' + tarif + '", "selbstbeteiligung" : true, "wohnflaeche" : ' + wohnflaeche + ', "glasversicherung" : true, "hrPlz" : ' + plz + '}');
    /*
    var jsonObject = {
        "tarifHv": "wert",
        "selbstbeteiligung" : true,
        "wohnflaeche" : wohnflaeche,
        "glasversicherung" : true,
        "hrPlz" : plz,
    }
    */
    return new Promise(
        function (resolve, reject) {
        restClient.post('/hausratRechnen', jsonObject, function(error, request, response, responseObject) {
            //assert.ifError(err);
            if((response.statusCode !== 200) || responseObject.hasOwnProperty("fehlerText")) {
                //console.log("Fehler mit Statuscode: " + response.statusCode);
                //console.log('%j', responseObject);
                //console.log('%j', response.headers);
                reject(responseObject);
            } else {
                //console.log('%j', responseObject);
                //console.log('Beitrag: ' + responseObject["beitragHv"]);
                resolve(responseObject);
            }
        });
        }
    );
};

var priceFormat = function (price) {
    return price.toFixed(2).replace(".", ",");
}

var getTarifCard = function(session, calcResponse, tarifForceKey){
    var tarifKey = tarifForceKey || calcResponse['tarifHv'];
    return new builder.HeroCard(session)
        .title( dialog_messages['hr-resultcard-title-tarif'+tarifKey] )
        .subtitle('Preis: '+ priceFormat(calcResponse['beitragHv']) +' €')
        .text( dialog_messages['hr-resultcard-text-tarif'+tarifKey] )
        .images([
            builder.CardImage.create(session,
                dialog_messages['hr-resultcard-image-tarif'+tarifKey]
            )
        ])
        .buttons([
            builder.CardAction.openUrl(session,
                'http://nb767.cosmos.local:8081/CosmosCAE/S/cosmos/hausratversicherung/#beitrag-berechnen!app-hausrat-versicherung?id=eyJjdHkiOiJ0ZXh0XC9wbGFpbiIsImFsZyI6IkhTMjU2In0.W3sid29obmZsYWVjaGUiOjc4LCJwbHoiOiI0OTQ3NyIsImx6IjoxMCwienciOiIxMiIsInNiIjowLCJndiI6IjEiLCJtaWNyb3R5cGUiOiIyMDAwMCJ9XQ.2RarG4yWkA02IYEQQzM4TgZ6VFlytF27WUQLol-OTtY',
                'Tarif Infos ...'
            ),
            builder.CardAction.openUrl(session,
                'http://nb767.cosmos.local:8081/CosmosCAE/S/cosmos/hausratversicherung/#beitrag-berechnen!app-hausrat-versicherung?id='+calcResponse['saveJwt'],
                'Jetzt Abschliessen'
            )
        ]);
}

exports.getCalculationResponse = function(session, calcResponseBasis, calcResponseComfort){
    return new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments([
            getTarifCard(session, calcResponseBasis),
            getTarifCard(session, calcResponseComfort),
            getTarifCard(session, calcResponseComfort, "CSH"),
        ]);
};

exports.teamCard = function(session){
    return new builder.Message(session).addAttachment(
        new builder.HeroCard(session)
            .title( "ChatBot TEAM" )
            .text("Dieses unfassbar gutaussehende Team hat diesen Bot in nicht mal 24h auf die Beine gestellt...")
            .images([
                builder.CardImage.create(session,
                    dialog_messages['team-image']
                )
            ])
    );
};

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
        if (session.message.text === '42') {
            // Return 'true' to indicate success
            session.endDialogWithResult({ response: true });
        } else {
            // Re-prompt user
            session.send(session.dialogData.retryPrompt);
        }
    });

exports.infoCards = function(session){
    var cards = [
        new builder.HeroCard(session)
            .title('Leitungswasser')
            .subtitle('Schadenbeispiel: Der Kunde verließ am Morgen das Haus. Im Laufe des Vormittags platzte ein Filter der Wasserzuleitung seiner Waschmaschine. Als er gegen Mittag nach hause kam, hatte sich das ausgetretene Wasser im kompletten Erdgeschoss über die gesamte Wohnfläche verteilt.') //.text('')
            .images([
                builder.CardImage.create(session, 'https://www.cosmosdirekt.de/CosmosCAE/S/linkableblob/home/102010-15572/data.jpg')
            ]),
        new builder.HeroCard(session)
            .title('Wohnungsbrand')
            .subtitle('Schadenbeispiel: Durch einen Kurzschluss fing der Wäsche­trockner Feuer und brannte aus. Alle Versorgungs­leitungen waren verschmort. Aufgrund der starken Rauch- und Ruß­entwicklung war das Haus vorüber­gehend nicht bewohnbar.') //.text('')
            .images([
                builder.CardImage.create(session, 'https://www.cosmosdirekt.de/CosmosCAE/S/linkableblob/home/102020-15570/data.jpg')
            ]),
        new builder.HeroCard(session)
            .title('Einbruch­diebstahl und Vandalismus')
            .subtitle('Schadenbeispiel: Der Einbruch fand statt, als die Eltern auf der Arbeit waren und die Kinder in der Schule. Die Eingangs­tür des Mehr­familien­hauses war verschlossen. Die Wohnungstür wurde aufgebrochen und die Wohnung komplett verwüstet. Wert­sachen wie Schmuck und Elektro­geräte wurden ent­wendet.') //.text('')
            .images([
                builder.CardImage.create(session, 'https://www.cosmosdirekt.de/CosmosCAE/S/linkableblob/home/102030-15571/data.jpg')
            ]),
    ];
    return new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(cards);
};

// session.send( dialog_modules.exampleCards(session) );
