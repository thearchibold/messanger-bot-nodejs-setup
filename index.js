const express = require('express');
const bodyParser = require('body-parser');

//routes import
const webhook = require('./routes/webhook');


const app = express()
app.use(bodyParser.json());


//route use
app.use('/webhook', webhook);



const server = app.listen(process.env.PORT || 5000, () => {
  console.log("Server is running", new Date())
})