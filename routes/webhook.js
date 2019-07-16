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





router.post('/', (req, res, _next) => {

  
  let body = req.body;
  res.status(200).send('EVENT_RECEIVED');

 // console.log("incoming request", body);

  //check this is an event from a page
  if (body.object === 'page') {
    
    let webhook_event;

    
    //webhook_event = body.entry[0].messaging[0];
    body.entry.forEach(element => {
     
      console.log("page ID", element.id); 

      webhook_event = element.messaging[0];

       let sender_psid = webhook_event.sender.id;
     
      console.log('Sender PSID: ' + sender_psid);     

      if (webhook_event.message) {
        console.log(webhook_event.message.text);

        sendBotTyping(sender_psid, "typing_on");
        handleMessage(sender_psid, webhook_event.message, element.id);
        sendBotTyping(sender_psid, "typing_off");
       // res.status(200).send('EVENT_RECEIVED');
      }
      if (webhook_event.postback) {
        console.log(webhook_event.postback);

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



const handleMessage = (sender_psid, _received_message, _pageId) => {
  console.log("calling handle message");
  let message = "Sorry 🤭, we could'nt figure out what you want,  but would you like to..."
  handleMessageUnknown(sender_psid, message);

  //sendMessageReply(sender_psid, "Thanks for getting in touch, Please select any of the options below");
  //fetchEvents(pageId, sender_psid);
}




const handlePostback = (sender_psid, received_postback, pageId) => {

  let payload = received_postback.payload;
 
    if(payload === 'GET_STARTED'){
      
      let message = "Hello 🤩!!!";
      handleMessageUnknown(sender_psid, message);
      
    }  
   else if (payload === 'explore_event') {
    
      callBuyTicketPostback(sender_psid);
      sendBotTyping(sender_psid, "typing_off");
    }
    else if (payload === "explore") {
      fetchEvents(pageId, sender_psid);
      sendBotTyping(sender_psid, "typing_off");

    }
    else if (payload === "end") {
      let message = "Thank you for your time 🤝. Always get started by 👇..."
      handleMessageUnknown(sender_psid, message);
      sendBotTyping(sender_psid, "typing_off");
    }
    else if (getEventPostBack(payload)[0] === "event") {
      fetchTicket(pageId, sender_psid, getEventPostBack(payload)[1]);
    }
    else if (getTicketPostBack(payload[0] === "ticket")) {
      callSendAPI(sender_psid, "Thank you for your choice we will get back to you shortly...");
  }
  
  
    sendBotTyping(sender_psid, "typing_off");

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
}, (err, _res, _body) => {
    if (!err) {
        
    } else {
        console.error("Unable to send message:" + err);
    }
})
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
  }, (err, _res, _body) => {
      if (!err) {
          if(cb){
              cb();
          }
      } else {
          console.error("Unable to send message:" + err);
      }
  });
}

const sendEvents = (sender_psid,events, cb = null) => {
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
          "template_type": "generic",
          "elements": events 
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
}



const fetchEvents = (pageId, psid) => {
  
  console.log(`Fetching events for ${pageId}`)
  var options = { method: 'GET',
  url: 'https://myticketgh.com/api/events',
  headers: 
   { Connection: 'keep-alive',
     'accept-encoding': 'gzip, deflate',
     Host: 'myticketgh.com',
     Accept: '*/*',
    } };

   request(options, function (error, _response, body) {
   if (error) throw new Error(error);
     let res = JSON.parse(body);
     let items = []
     res.forEach(item => {
      items.push({
        "title": item.name,
        "subtitle": `${item.category} - ${item.day} ${item.month}`,
        "image_url": item.banners[0],       
        "buttons": [
          {
            "title": "View Tickets",
            "type": "postback",
            "payload":`event_${item.slug}`         
          }
        ]
      })
     })
     console.log("element for facebook ", items[0])
     console.log("sending events right after fetching")
     sendEvents(psid, items);
});
}



const fetchTicket = (pageId, psid, slug) => {

  console.log(`Fetching events for ${pageId}`)
  var options = { method: 'GET',
  url: `https://myticketgh.com/api/events/${slug}`,
  headers: 
   { Connection: 'keep-alive',
     'accept-encoding': 'gzip, deflate',
     Host: 'myticketgh.com',
     Accept: '*/*',
    } };

   request(options, function (error, _response, body) {
   if (error) throw new Error(error);
     let res = JSON.parse(body);

     //console.log("Tickets for events ", res.schedules[0].tickets);
     let items = []
     let {date, time, tickets} =res.schedules[0]
     tickets.forEach(item => {
      items.push({
        "title": item.name,
        "subtitle": `${item.venue}
                    \nPrice - ${item.price}  
                    \nDate  - ${String(tickets)} 
                    \nTime  - ${String(time)}`,      
        "buttons": [
          {
            "title": "Buy Ticket",
            "type": "postback",
            "payload":`ticket_${item.slug}`         
          }
        ]
      })
     })
     console.log("element for facebook ", items[0])
     console.log("sending events right after fetching")
     sendEvents(psid, items);
});
  
}



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
        "title":"Explore events 💪🥳",
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
  
}



function getEventPostBack(postback) { 
  console.log(postback.indexOf("event") > - 1)
  return [type, slug] = postback.split("_");
}

function getTicketPostBack(postback) { 
  console.log(postback.indexOf("ticket") > - 1)
  return [type, slug] = postback.split("_");
}

module.exports = router