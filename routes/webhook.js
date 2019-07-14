const router = require('express').Router();
var request = require("request");


require('dotenv').config()

require("../helpers/functions")


const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const SEND_API = process.env.SEND_API;

console.log("Page token", PAGE_ACCESS_TOKEN)




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





router.post('/', (req, res, next) => {

  
  let body = req.body;
  res.status(200).send('EVENT_RECEIVED');

 // console.log("incoming request", body);

  //check this is an event from a page
  if (body.object === 'page') {
    
    let webhook_event;

    let event = getEvents("pageId");
      console.log(event)
    //webhook_event = body.entry[0].messaging[0];
    body.entry.forEach(element => {
      console.log("page ID", element.id); 

      


      
      webhook_event = element.messaging[0];
       let sender_psid = webhook_event.sender.id;
     
      console.log('Sender PSID: ' + sender_psid);
      

     

      if (webhook_event.message) {
        console.log(webhook_event.message.text);

        sendBotTyping(sender_psid, "typing_on");
        handleMessage(sender_psid, webhook_event.message);
        sendBotTyping(sender_psid, "typing_off");
       // res.status(200).send('EVENT_RECEIVED');
      }
      if (webhook_event.postback) {
        console.log(webhook_event.postback)

        sendBotTyping(sender_psid, "typing_on");
        handlePostback(sender_psid, webhook_event.postback, element.id);
        sendBotTyping(sender_psid, "typing_off");
        //res.status(200).send('EVENT_RECEIVED');
        
      }
      
    
    });

   
  } else {
    res.sendStatus(403)
  }

  
})



const handleMessage = (sender_psid, received_message) => {
  console.log("calling handle message");
  let response = "We will get  back to you later"
  sendMessageReply(sender_psid, "Thanks for getting in touch, Please select any of the options above");
 
}




const handlePostback = (sender_psid, received_postback, pageId) => {

  let payload = received_postback.payload;
 
    if(payload === 'GET_STARTED'){
      
      //fetch page event
      

      response = getStartedTemplate();
      callSendAPI(sender_psid, response);
      
    }
  
   else if (payload === 'explore_event') {
    
      callBuyTicketPostback(sender_psid);
    
  }

}








const getStartedTemplate = () => {
  return {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [
          {
            "title": "Welcome!",
            "image_url": "https://myticketgh.com/assets/images/logo.png",
            "subtitle": "What would you like to do today.",
            "buttons": [
              {
                "type": "postback",
                "title": "Explore events",
                "payload": "explore_event"
              }
            ]
          }
        ]
      }
    }
  
  }
}


const sendBotTyping = (sender_psid,typing_state, cb = null) => {
  console.log("calling buy ticket")
  // Construct the message body
  let request_body = {
    "recipient":{
      "id":sender_psid
    },
   "sender_action":typing_state
  }  

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
        console.log("Response message", res);
      } else {
          console.error("Unable to send message:" + err);
      }
  });
}


//event ticket template

const sendMessageReply = (psid, message) => {
  let body = {
    "recipient":{
      "id":psid
    },
    "message":{
      "text":message
    }
  }


  request({
    "uri": "https://graph.facebook.com/v3.0/me/messages" ,
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": body
}, (err, res, body) => {
    if (!err) {
        
    } else {
        console.error("Unable to send message:" + err);
    }
});
}




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

const callBuyTicketPostback = (sender_psid,events, cb = null) => {
  console.log("calling buy ticket")
  // Construct the message body
  let request_body = {
    "recipient":{
      "id":sender_psid
    },
    "message": {
        "attachment": {
        "type": "template",
        "payload": {
          "template_type": "list",
          "top_element_style": "compact",
          "elements": events,
           "buttons": [
            {
              "title": "View More",
              "type": "postback",
              "payload": "payload"            
            }
          ]  
        }
      }
    }
  }
  

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
        console.log("Response message", res);
      } else {
          console.error("Unable to send message:" + err);
      }
  });
}



const getEvents = (pageId) => {
  let element = []
  console.log(`Fetching events for ${pageId}`)
  var options = { method: 'GET',
  url: 'https://myticketgh.com/api/events',
  headers: 
   { Connection: 'keep-alive',
     'accept-encoding': 'gzip, deflate',
     Host: 'myticketgh.com',
     Accept: '*/*',
     'User-Agent': 'PostmanRuntime/7.15.0' } };

   request(options, function (error, response, body) {
   if (error) throw new Error(error);

     console.log(body);
     body.forEach(item => {
       element.push({
        "title": `${item.id} - ${item.name}`,
        "subtitle": item.category,
        "image_url": item.banners[0],          
        "buttons": [
          {
            "title": "View Details",
            "type": "web_url",
            "url": "https://google.com",
            "webview_height_ratio": "tall",          
          }
        ]
      })
     })
     return element
});
}



module.exports = router