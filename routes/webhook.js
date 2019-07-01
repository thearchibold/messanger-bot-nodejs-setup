const router = require('express').Router();
var request = require("request");


require('dotenv').config()

require("../helpers/functions")


const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const SEND_API = process.env.SEND_API;

console.log("Page token", PAGE_ACCESS_TOKEN)




router.post('/', (req, res, next) => {

  
  let body = req.body;

 // console.log("incoming request", body);

  //check this is an event from a page
  if (body.object === 'page') {
    let webhook_event;
    body.entry.forEach(element => {
     
      webhook_event = element.messaging[0];
    
    });

    let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
      //messenger.handleMessage(sender_psid, webhook_event.message);

      if (webhook_event.message) {
        console.log(webhook_event.message)
        console.log("sending reply");
        handleMessage(sender_psid, webhook_event.message);
      }
      else if (webhook_event.postback) {
        console.log(webhook_event.postback)
        handlePostback(sender_psid, webhook_event.postback);
    }
      

    res.status(200).send("EVENT_RECEIVED")

  } else {
    res.sendStatus(403)
  }

  
})


router.get('/', (req, res) => {
  handleMessage();
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = process.env.VERIFY_TOKEN
    
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


const handleMessage = (sender_psid, received_message) => {
  console.log("calling handle message")
  let response;
  

  if (received_message.text) {

  }
}




const handlePostback = (sender_psid, received_postback) => {

  let payload = received_postback.payload;
 
    if(payload === 'GET_STARTED'){
        // response = askTemplate('Welcome to MyTicketGH');
      response = getStartedTemplate();
        callSendAPI(sender_psid, response);
    }
  
  if (payload === 'MAKE_PAYMENT') {
    response = makePaymentTemplate('Please select your payment option');
    callSendAPI(sender_psid, response);
    
  }
  if (payload === 'BUY_TICKET') {
    response = buyTicketTemplate('Please select your destination');
    callSendAPI(sender_psid, response);    
  }
}





const askTemplate = (text) => {
  return {
      "attachment":{
          "type":"template",
          "payload":{
            "template_type": "generic",
            "title": "MyTicketGH",
            "image_url": "https://myticketgh.com/assets/images/logo.png",
              "text": text,
              "buttons":[
                  {
                      "type":"postback",
                      "title":"Make Payment",
                      "payload":"MAKE_PAYMENT"
                  },
                  {
                      "type":"postback",
                      "title":"Buy Ticket",
                      "payload":"BUY_TICKET"
                  }
              ]
          }
      }
  }
}



const buyTicketTemplate = (text) => {
  return {
      "attachment":{
          "type":"template",
          "payload":{
              "template_type":"button",
              "text": text,
              "buttons":[
                  {
                      "type":"postback",
                      "title":"Accra",
                      "payload":"ACCRA"
                  },
                  {
                      "type":"postback",
                      "title":"Kumasi",
                      "payload":"KUMASI"
                  }
              ]
          }
      }
  }
}



const makePaymentTemplate = (text) => {
  return {
      "attachment":{
          "type":"template",
          "payload":{
              "template_type":"button",
              "text": text,
              "buttons":[
                  {
                      "type":"postback",
                      "title":"Mobile Money",
                      "payload":"MO_MO"
                  },
                  {
                      "type":"postback",
                      "title":"Credit Card",
                      "payload":"CREDIT_CARD"
                  }
              ]
          }
      }
  }
}


const getStartedTemplate = () => {
  return {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
           {
            "title":"Welcome!",
            "image_url":"https://petersfancybrownhats.com/company_image.png",
            "subtitle":"What would you like to do today.",
            // "default_action": {
            //   "type": "web_url",
            //   "url": "https://petersfancybrownhats.com/view?item=103",
            //   "webview_height_ratio": "tall",
            // },
            "buttons":[
              {
                "type":"web_url",
                "url":"https://petersfancybrownhats.com",
                "title":"View Website"
              },{
                "type":"postback",
                "title":"Start Chatting",
                "payload":"DEVELOPER_DEFINED_PAYLOAD"
              }              
            ]      
          }
        ]
      }
    }
  }
}



// Sends response messages via the Send API
const callSendAPI = (sender_psid, response, cb = null) => {
  // Construct the message body
  let request_body = {
      "recipient": {
          "id": sender_psid
      },
      "message": response
  };

  // Send the HTTP request to the Messenger Platform
  request({
      "uri": "https://graph.facebook.com/v3.0/me/messages" ,
      "qs": { "access_token": PAGE_ACCESS_TOKEN },
      "method": "POST",
      "json": request_body
  }, (err, res, body) => {
      if (!err) {
          if(cb){
              cb();
          }
      } else {
          console.error("Unable to send message:" + err);
      }
  });
}


// https://www.google.com.gh/imgres?imgurl=https%3A%2F%2Flookaside.fbsbx.com%2Flookaside%2Fcrawler%2Fmedia%2F%3Fmedia_id%3D877334128993545&imgrefurl=https%3A%2F%2Fwww.facebook.com%2Fmyticketgh%2F&docid=GD7vs2h-K2m1mM&tbnid=W4L7YMbh1BmzGM%3A&vet=10ahUKEwipwcfA15XjAhUa5uAKHf-rCsgQMwg-KAAwAA..i&w=300&h=300&bih=604&biw=1366&q=myticketgh&ved=0ahUKEwipwcfA15XjAhUa5uAKHf-rCsgQMwg-KAAwAA&iact=mrc&uact=8




module.exports = router