const router = require('express').Router();
const request = require("request");
const FacebookUser = require("../models/FacebookUser");
require('dotenv').config();
require("../helpers/functions");


const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;



router.get('/', (req, res) => {
  handleMessage();
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(403)
  }
});





router.post('/', async (req, res, _next) => {


  let body = req.body;
  //console.log(body.id);

  //check this is an event from a page
  if (body.object === 'page') {

    let webhook_event;

    //extract id and sender details from
    let { id } = body.entry[0];
    let { sender } = body.entry[0].messaging[0];

    console.log(id, sender);

    //webhook_event = body.entry[0].messaging[0];
    body.entry.forEach(async element => {
        console.log("page ID", element.id);

        webhook_event = element.messaging[0];

        //sender psid to be used for replies
        let sender_psid = webhook_event.sender.id;

        console.log('Sender PSID: ' + sender_psid);

        //message handler
        if (webhook_event.message) {
            console.log(webhook_event.message.text);
            sendBotTyping(sender_psid, "typing_on");

            const res = handleMessage(sender_psid, webhook_event.message, element.id, facebookUser);

            sendBotTyping(sender_psid, "typing_off");

        }

        //postback handler
        if (webhook_event.postback) {
            console.log(webhook_event.postback);

            sendBotTyping(sender_psid, "typing_on");
            const res = handlePostback(sender_psid, webhook_event.postback, element.id);

            console.log(res);
            sendBotTyping(sender_psid, "typing_off");

        }


    });


  } else {
      res.sendStatus(403);
  }
});



const handleMessage = async (sender_psid, received_message, pageId ) => {
  
    console.log("Implement postback methods here",);
};




const handlePostback = async (sender_psid, received_postback, pageId, facebookUser) => {
    let payload = received_postback.payload;
    if(payload === 'GET_STARTED'){
        let message = "Hello welcome to our page🤩!!!";
        handleMessageUnknown(sender_psid, message);
    }

    sendBotTyping(sender_psid, "typing_off");

};








const sendBotTyping = (sender_psid,typing_state, cb = null) => {
  let request_body = {
    "recipient":{
      "id":sender_psid
    },
   "sender_action":typing_state
  }  ;

  // Send the HTTP request to the Messenger Platform
  request({
      "uri": "https://graph.facebook.com/v3.0/me/messages" ,
      "qs": { "access_token": PAGE_ACCESS_TOKEN },
      "method": "POST",
      "json": request_body
  }, (err, _res, _body) => {
      if (!err) {
          if(cb){
              cb();
          }
       // console.log("Response message", res);
      } else {
          console.error("Unable to send message:" + err);
      }
  });
};


//event ticket template

const sendMessageReply = (psid, message) => {
  let body = {
    "recipient":{
      "id":psid
    },
    "message":{
      "text":message
    }
  };


  request({
    "uri": "https://graph.facebook.com/v3.0/me/messages" ,
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": body
}, (err, _res, _body) => {
    if (!err) {

    } else {
        console.error("Unable to send message:" + err);
    }
})
};




// Sends response messages via the Send API
const callSendAPI = (sender_psid, response, cb = null) => {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "messaging_type": "RESPONSE",
        "message": response
    };

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v3.0/me/messages" ,
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, _res, _body) => {
        if (!err) {
            if(cb){
                cb();
            }
        } else {
            console.error("Unable to send message:" + err);
        }
    });
};





const handleMessageUnknown = (psid, message) => {
    var options = {
        "uri": "https://graph.facebook.com/v3.0/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": {
            "recipient": { id: psid },
            "message":{
                "attachment":{
                    "type":"template",
                    "payload":{
                        "template_type":"button",
                        "text": message,
                        "buttons":[
                            {
                                "type":"postback",
                                "title":"Not interested 😢",
                                "payload":"end"
                            },{
                                "type":"postback",
                                "title":"Do Something 💪🥳",
                                "payload":"explore"
                            }
                        ]
                    }
                }
            }
        }
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
  });

};



module.exports = router;
