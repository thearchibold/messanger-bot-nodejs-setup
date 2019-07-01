var request = require("request");


// https://jsonplaceholder.typicode.com/todos/1


request('https://jsonplaceholder.typicode.com/todos/1', function (error, response, body) {
  console.log('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  console.log('body:', body); // Print the HTML for the Google homepage.
});

// var options = { method: 'POST',
//   url: 'https://graph.facebook.com/v3.3/me/messages',
//   qs: { access_token: 'EAACZAQYnNwFkBANmmLg7jzPCmoZAr4VIKUHssp95CpZAgvmGNL5ND1sT5G48PX7juY9bkpzXFKBZBigfGC5VbKyvBD3abw2QadypNL5SLZBwgRkK9G7o9aV3MD1BN3O5qQpEZCkw6jXhhUzeqEcBFtzvrlPxZADjZBv907YfHE4z5gZDZD' },
//   headers: 
//    { Connection: 'keep-alive',
//      'content-length': '119',
//      'accept-encoding': 'gzip, deflate',
//      Host: 'graph.facebook.com',
//      Accept: '*/*',
//      'User-Agent': 'PostmanRuntime/7.15.0',
//      'Content-Type': 'application/json' },
//   body: 
//    { recipient: { id: 2402504579772777 },
//      message: 'Welcome home dear' },
//   json: true };

// request(options, function (error, response, body) {
//   if (error) throw new Error(error);

//   console.log(body);
// });
