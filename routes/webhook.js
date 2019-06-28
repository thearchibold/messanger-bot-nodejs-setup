const router = require('express').Router();

router.post('/', (request, response, next) => {

  let body = request.body;

  //check this is an event from a page
  if (body.object === 'page') {
    body.entry.forEach(element => {
      let webhook_event = element.messaging[0];
      console.log(webhook_event)
    });
  }

  response.status(200).send("Web hook event")
})


router.get('/', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "testwebhook12345"
    
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