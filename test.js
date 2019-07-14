var request = require("request");

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
  let res = JSON.parse(body);
   res.forEach(element => {
     console.log({
       "title":element.name
     })
   });
});
