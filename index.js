'use strict';
require('dotenv').config()

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

const express = require('express');
const bodyParser = require('body-parser');
const path = require("path");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;


//routes import
const webhook = require('./routes/webhook');


const app = express()


app.use(bodyParser.json());



//route use
app.use('/webhook', webhook);


app.set('views',path.join(__dirname, 'views') )




const server = app.listen(process.env.PORT || 5000, () => {
  console.log("Server is running", new Date());
  console.log("Making connection to mongo DB")
  
  let mongo_link = process.env.MONGO_DB_URL;

 mongoose.connect(mongo_link, { useCreateIndex: true, useNewUrlParser: true }).then(function () { 
  console.log("Connection Made")

}).catch(function (error) {
  console.log(error.message);
 });

})

