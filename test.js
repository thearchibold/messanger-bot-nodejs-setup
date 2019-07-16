var request = require("request");

const token ="EAAQc78T7kqsBAEO2fWZC1MWl7fEZAXfr3skmnZBr34aGcQawCrE7wMuwk8acSg5U6nmp4sF5ZCbx4I17CZAok5tUQeJQJj3tTmrUVXhadolzpFWsF9lWJe2aZBpsQhalOj1m4sj5nSvjhrDVY1zmWcyPNGW5f8UjBheSeDSCwdvxvj8XtlztQL"


const handleMessageUnknown = (psid, message) => {
  var options = {
    "uri": "https://graph.facebook.com/v3.0/me/messages",
    "qs": { "access_token": token },
    "method": "POST",
    "json": {
      recipient: { id: psid },
      messaging_type: 'RESPONSE',
      message: {
        text: message,
        quick_replies:
          [{
            content_type: 'text',
            title: 'Not interested 😢',
            payload: 'end'
          },
          {
            content_type: 'text',
            title: 'Explore events 💪🥳',
            payload: 'explore'
          }]
      }
    }
  };
  
  request(options, function (error, response, body) {
    if (error) throw new Error(error);
  
    console.log(body);
  });
  
}

let message = ` 🤝 Thank you for your time. Always get started by 👇...`

console.log(message.indexOf("Thank"));
// handleMessageUnknown(2333191926726881, message);
