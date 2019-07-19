const router = require('express').Router();
var request = require("request");

const FacebookUser = require("../models/FacebookUser");
const Ticket = require("../models/Ticket");

require('dotenv').config()

require("../helpers/functions");


const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const SEND_API = process.env.SEND_API;



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

router.post('/update',async (req, res, next) => {
  console.log(req.query.id);
  const up = FacebookUser.where({ _id: req.query.id });
  up.setOptions({ overwrite: false })
  let result = await up.updateOne({$set: {current: 'done', status:0}}).update().exec().catch(err=>console.log(err))
  console.log(result)
})



router.post('/', async (req, res, _next) => {

  
  let body = req.body;
  //console.log(body.id);

  //check this is an event from a page
  if (body.object === 'page') {
    
    let webhook_event;

    let { id } = body.entry[0];
    let { sender } = body.entry[0].messaging[0];

    console.log(id, sender)

     let facebookUser = null;
     let query =  FacebookUser.findById(sender.id, 'current');
     const fbuser = await query.exec().catch(err=> {console.log(err)});
     if (!fbuser) {
       let newUserObject = new FacebookUser({
         _id: sender.id,
         current: "convo",
         status: 0
       });
       const newUser = await newUserObject.save().catch(err => { console.log(err)});
       facebookUser = newUser;
     } else {
       //console.log(fbuser);
       facebookUser = fbuser;
       }

    
    //webhook_event = body.entry[0].messaging[0];
    body.entry.forEach(async element => {
      res.status(200).send('EVENT_RECEIVED');
     
      console.log("page ID", element.id); 

      webhook_event = element.messaging[0];

       let sender_psid = webhook_event.sender.id;

      
       //read facebook ID check if user has an active session
     
     
      console.log('Sender PSID: ' + sender_psid);     

      if (webhook_event.message) {
        console.log(webhook_event.message.text);

        sendBotTyping(sender_psid, "typing_on");
        handleMessage(sender_psid, webhook_event.message, element.id, facebookUser);
        sendBotTyping(sender_psid, "typing_off");
        
      }
      if (webhook_event.postback) {
        console.log(webhook_event.postback);

        sendBotTyping(sender_psid, "typing_on");
        handlePostback(sender_psid, webhook_event.postback, element.id);
        sendBotTyping(sender_psid, "typing_off");
        
      }
      
    
    });

   
  } else {
    res.sendStatus(403);
  }

  
})



const handleMessage = async (sender_psid, received_message, pageId, facebookUser ) => {
  console.log("this is the current user state..",facebookUser.current);
  
  if (facebookUser.current === 'convo') {
    //send send the option of seeing events
    let message = "You have not expressed in any interest in event, take a look"
    sendMessageReply(sender_psid, message);
    fetchEvents(pageId, sender_psid);
  }

  else if (facebookUser.current === 'name') {

    //process the name and make sure it is valid
    console.log("Received name:", received_message.text);
    const up = FacebookUser.where({ _id: sender_psid });
    up.setOptions({ overwrite: false });
    let result = await up.updateOne({$set: {current: 'phone', status:0, name:received_message.text}}).update().exec().catch(err=> console.log(err))
    console.log(result);

    //if valid send the phone request
    sendMessageReply(sender_psid, "Alight, payment is by mobile mobile money. Send your mobile money number.");
    
    
    
  }
  else if (facebookUser.current === 'phone') {

    
    //process the name and make sure it is valid
    if (facebookUser.phone) {
          console.log();
          if (facebookUser.phone.match(/^[0-9]+$/) && facebookUser.phone.length >= 10) {
            console.log("valid");
            sendMessageReply(sender_psid, `Sending message to ${facebookUser.phone}...`);
            //do all the neccesary backend calls to the mobile money API.
            setTimeout(() => {
              sendMessageReply(sender_psid, "Payment is complete. Enjoy yourself");          
            })
          }
          else {
            console.log("invalid");
            sendMessageReply(sender_psid, "Please your phone number is invalid, enter a valid number");
          }
    } else {
      sendMessageReply(sender_psid, "No valid Mobile money number found, what is your mobile money number");
    
    }
    // const up = FacebookUser.where({ _id: sender_psid });
    // up.setOptions({ overwrite: false });
    // let result = await up.updateOne({$set: {current: 'payment', status:0, phone:received_message.text}}).update().exec().catch(err=> console.log(err))
    // console.log(result);

    //if valid send the phone request
    sendMessageReply(sender_psid, "A message will be sent to your phone, please continue the payment. Once payment is complete, a messange will be sent to you.");
    
    
  } else if (facebookUser.current === 'payment') {
    if (facebookUser.phone) {
      sendMessageReply(sender_psid, `A message will be sent to $, please continue the payment. Once payment is complete, a messange will be sent to you.`);

    }
    
  }
  else {
    let message = "Sorry 🤭, we could'nt figure out what you want,  but would you like to..."
    handleMessageUnknown(sender_psid, message);
  }
  
  



  //sendMessageReply(sender_psid, "Thanks for getting in touch, Please select any of the options below");
  //fetchEvents(pageId, sender_psid);
}




const handlePostback = async (sender_psid, received_postback, pageId, facebookUser) => {

  let payload = received_postback.payload;
 
    if(payload === 'GET_STARTED'){
      
      let message = "Hello welcome to our page🤩!!!";
      handleMessageUnknown(sender_psid, message);

      //then update the convo field in DB.
      const up = FacebookUser.where({ _id: sender_psid });
      up.setOptions({ overwrite: false })
      let result = await up.updateOne({$set: {current: 'getting_started', status:0}}).update().exec().catch(err=>console.log(err))
      console.log(result);
      
    }  
   else if (payload === 'explore_event') {
    
      callBuyTicketPostback(sender_psid);
      sendBotTyping(sender_psid, "typing_off");


    }
    else if (payload === "explore") {
      fetchEvents(pageId, sender_psid);
      sendBotTyping(sender_psid, "typing_off");

      const up = FacebookUser.where({ _id: sender_psid });
      up.setOptions({ overwrite: false })
      let result = await up.updateOne({$set: {current: 'events', status:0}}).update().exec().catch(err=>console.log(err))
      console.log(result);

    }
    else if (payload === "end") {
      let message = "Thank you for your time 🤝. Always get started by 👇..."
      handleMessageUnknown(sender_psid, message);
      sendBotTyping(sender_psid, "typing_off");

      //this one just delete the entry
      // const up = FacebookUser.where({ _id: sender_psid });
      // up.setOptions({ overwrite: false })
      // let result = await up.updateOne({$set: {current: 'getting_started', status:0}}).update().exec().catch(err=>console.log(err))
      // console.log(result);
    }
    else if (getEventPostBack(payload)[0] === "event") {
      
      //check if the payload is event, return the tickets for the event.
      fetchTicket(pageId, sender_psid, getEventPostBack(payload)[1]);
      const up = FacebookUser.where({ _id: sender_psid });
      up.setOptions({ overwrite: false })
      let result = await up.updateOne({$set: {current: 'events', status:0}}).update().exec().catch(err=>console.log(err))
      console.log(result);
    }
    else if (getTicketPostBack(payload)[0] === "ticket") {
      console.log("Ticket chosed", getTicketPostBack(payload)[1])
      sendMessageReply(sender_psid, "Can you now enter your name.\nPlease NOTE: that this name will be printed on your ticket.");

      //process the name
      const up = FacebookUser.where({ _id: sender_psid });
      up.setOptions({ overwrite: false })
      let result = await up.updateOne({$set: {current: 'name', status:0 }}).update().exec().catch(err=>console.log(err))
      console.log(result);
      //console.log(result);
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
  //console.log("calling buy ticket")
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
  //console.log("calling buy ticket")
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
        "title": `${res.name}  ${item.name}`,
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