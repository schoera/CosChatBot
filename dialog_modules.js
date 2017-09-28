
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