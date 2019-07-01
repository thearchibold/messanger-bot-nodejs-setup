'use strict';
require('dotenv').config()

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

const express = require('express');
const bodyParser = require('body-parser');

//routes import
const webhook = require('./routes/webhook');


const app = express()
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


//route use
app.use('/webhook', webhook);



const server = app.listen(process.env.PORT || 5000, () => {
  console.log("Server is running", new Date())
})