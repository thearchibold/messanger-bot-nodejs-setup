const router = require('express').Router();
var request = require("request");


require('dotenv').config()

require("../helpers/functions")


const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const SEND_API = process.env.SEND_API;




router.post('/', (req, response, next) => {

  let body = req.body;

 // console.log("incoming request", body);

  //check this is an event from a page
  if (body.object === 'page') {
    body.entry.forEach(element => {
     
      let webhook_event = element.messaging[0];
     

      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
      //messenger.handleMessage(sender_psid, webhook_event.message);

      if (webhook_event.message) {
        
        console.log("sending response")


        var options = { method: 'POST',
        url: 'https://graph.facebook.com/v3.3/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        headers: 
        { Connection: 'keep-alive',
          'accept-encoding': 'gzip, deflate',
           Host: 'graph.facebook.com',
          Accept: '*/*',

          'Content-Type': 'application/json' },
        body: 
        { recipient: { id: sender_psid },
          message: 'This is a test reply from Archibold' },
        json: true };

      request(options, function (error, response, body) {
        if (error) throw new Error(error);

        console.log(body);
});

       
        //handleMessage(sender_psid, webhook_event.message);
    } else if (webhook_event.postback) {
        
      }
      


    });

    response.status(200).send("EVENT_RECEIVED")

  } else {
    response.sendStatus(403)
  }

  
})


router.get('/', (req, res) => {

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



module.exports = router