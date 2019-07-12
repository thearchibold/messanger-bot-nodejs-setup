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

    //webhook_event = body.entry[0].messaging[0];
    body.entry.forEach(element => {
      console.log("page ID", element.id); 
      
      webhook_event = element.messaging[0];
       let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
      //messenger.handleMessage(sender_psid, webhook_event.message);

      if (webhook_event.message) {
        console.log(webhook_event.message.text)
        console.log("sending reply");
        handleMessage(sender_psid, webhook_event.message);
       // res.status(200).send('EVENT_RECEIVED');
      }
      if (webhook_event.postback) {
        console.log(webhook_event.postback)
        handlePostback(sender_psid, webhook_event.postback);
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




const handlePostback = (sender_psid, received_postback) => {

  let payload = received_postback.payload;
 
    if(payload === 'GET_STARTED'){
        // response = askTemplate('Welcome to MyTicketGH');
      response = getStartedTemplate();
      callSendAPI(sender_psid, response);
      
    }
  
   else if (payload === 'explore_event') {
    //response = makePaymentTemplate('Please select your payment option');
      //response = getTicketCarouselTemplate();
      callBuyTicketPostback(sender_psid);
    
  }
 else if (payload === 'BUY_TICKET') {
    response = buyTicketTemplate('Please select your destination');
    callBuyTicketPostback(sender_psid);    
    }
    else if (payload === 'MO_MO') {
      console.log("sending momo payment page")
      response = ticketWebView();
      callSendAPI(sender_psid, response);
    }
    else if (payload === 'CREDIT_CARD') {
      console.log("sending card payment page")
      response = ticketWebView();
      callSendAPI(sender_psid, response);
    } else if (payload ==='buy_vip') {
      sendMessageReply(sender_psid, "VIP ticket option selected. Please enter your mobile money number")
  }else if (payload ==='buy_regular') {
    sendMessageReply(sender_psid, "Regular ticket option selected. Please enter your mobile money number")
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
    "message":{
      "text": "Thank you for your time. You can always return to check an event out. Just click \"Explore Events\" to get started",
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Done",
          "payload":"ACCRA",
        },{
          "content_type":"text",
          "title":"Explore Events",
          "payload":"KUMASI",
        }
      ]
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
            "image_url":"https://myticketgh.com/assets/images/logo.png",
            "subtitle":"What would you like to do today.",
            // "default_action": {
            //   "type": "web_url",
            //   "url": "https://petersfancybrownhats.com/view?item=103",
            //   "webview_height_ratio": "tall",
            // },
            "buttons":[
              {
                "type":"postback",
                "title":"Explore events",
                "payload":"explore_event"
            }          
            ]      
          }
        ]
      }
    }
  }
}


const ticketWebView = () => {
  return {
    attachment: {
      "type": "template",
      "payload": {
        "template_type": "list",
        "top_element_style": "compact",
        "elements": []  
      }










      
    }
  }

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
        if(cb){
            cb();
        }
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

const callBuyTicketPostback = (sender_psid, cb = null) => {
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
          "elements": [
            {
              "title": "Shazam",
              "subtitle": "From the DC world comes shazam",
              "image_url": "https://picsum.photos/id/200/300/200",          
              "buttons": [
                {
                  "title": "View Details",
                  "type": "web_url",
                  "url": "https://google.com",
                  "webview_height_ratio": "tall",          
                }
              ]
            },
            {
              "title": "Spiderman-Far from home",
              "subtitle": "Another classic from the Marvel Universe",
              "image_url": "https://picsum.photos/id/220/100/100",          
              "buttons": [
                {
                  "title": "View Details",
                  "type": "web_url",
                  "url": "https://myticketgh.com",
                  "webview_height_ratio": "tall",          
                }
              ]
            },
            {
              "title": "Spiderman-Into the spider verse",
              "subtitle": "Come watch young Miles save the multiverse",
              "image_url": "https://picsum.photos/id/489/100/100",          
              "buttons": [
                {
                  "title": "View Details",
                  "type": "web_url",
                  "url": "https://myticketgh.com",
                  "webview_height_ratio": "tall",
          
                }
              ]
            },
            {
              "title": "Shaft",
              "image_url": "https://picsum.photos/id/220/100/100",
              "subtitle": "Regina Hall",
              "buttons": [
                {
                  "title": "View Details",
                  "type": "web_url",
                  "url": "https://google.com",
                  "webview_height_ratio": "tall",
                }
              ]    
            }
          ],
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



 


const getTicketCarouselTemplate = () =>{
  return {
    "type": "carousel",
    "elements": [
      {
            "type": "vertical",
            "tag": "generic",
            "elements": [{
                "type": "vertical",
                "elements": [{
                    "type": "image",
                    "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQ_w8UO-QDbk2S2ZLuiuePHB7j6Qb86DLsjwddhp_yq4WaL_LL",
                    "tooltip": "Flowers"
                }, {
                    "type": "text",
                    "tag": "title",
                    "text": "Title",
                    "tooltip": "Title"
                }, {
                    "type": "text",
                    "tag": "subtitle",
                    "text": "subtitle",
                    "tooltip": "subtitle"
                }, {
                    "type": "button",
                    "tooltip": "Add to cart",
                    "title": "Add to cart",
                    "click": {
                        "actions": [{
                            "type": "publishText",
                            "text": "Add to cart pressed"
                        }]
                    }
                }, {
                    "type": "button",
                    "tooltip": "Add to cart",
                    "title": "Add to cart",
                    "click": {
                        "actions": [{
                            "type": "link",
                            "name": "Flowers",
                            "uri": "https://www.pinterest.com/lyndawhite/beautiful-flowers/"
                        }]
                    }
                }]
            }]
        }
    ]
}
}

module.exports = router