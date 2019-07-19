
function callSendAPI(psid, message) {
    let data = { 
        "recipient": { "id": psid }, 
        "message": message 
    };
    return axios({
        method: 'POST',
        url: SEND_API,
        params: { access_token: PAGE_ACCESS_TOKEN },
        data: data
    })
    .catch((error) => {
        if (error.response) {
            console.log('PSID: ', psid);
            console.log('Status code: ', error.response.status);
            console.log('Response: ', error.response.data);
        } else if (error.request) {
            console.log('Request: ', error.request); 
        } else {
            console.log('Error: ', error.message);
        }
    });
}



 function handleMessage(sender_psid, received_message) {
    // check if the input is text message
    // users might send smiley which can be filtered out
    if(typeof received_message.text !== "undefined") {
        let message = received_message.text.toLowerCase();
        callSendAPI(sender_psid, { text: message });
    }    
}