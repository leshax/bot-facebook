const fetch = require('node-fetch');

// You can find your project ID in your Dialogflow agent settings
const projectId = 'new-agent-69b89'; //https://dialogflow.com/docs/agents#settings
const sessionId = '123456';
const languageCode = 'en-US';

const dialogflow = require('dialogflow');

const config = {
  credentials: {
    private_key: process.env.DIALOGFLOW_PRIVATE_KEY,
    client_email: process.env.DIALOGFLOW_CLIENT_EMAIL
  }
};

const sessionClient = new dialogflow.SessionsClient(config);

const sessionPath = sessionClient.sessionPath(projectId, sessionId);

// Remember the Page Access Token you got from Facebook earlier?
// Don't forget to add it to your `variables.env` file.
const { FACEBOOK_ACCESS_TOKEN } = process.env;

const sendTextMessage = (userId, text) => {
  return fetch(
    `https://graph.facebook.com/v2.6/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        messaging_type: 'RESPONSE',
        recipient: {
          id: userId,
        },
        message: {
          text,
        },
      }),
    }
  );
}

const sendButtons = (userId, text, buttons) => {
   return fetch(
    `https://graph.facebook.com/v2.6/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        messaging_type: 'RESPONSE',
        recipient: {
          id: userId,
        },
        message: {
          "attachment":{
            "type":"template",
            "payload":{
              "template_type":"button",
              "text": text,
              "buttons": buttons
          }
        }
      }
    }),
  }); 
}

module.exports = (event) => {
  const userId = event.sender.id;
  const message = event.message.text;

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: languageCode,
      },
    },
  };

  sessionClient
    .detectIntent(request)
    .then(responses => {
      //console.log(JSON.stringify(myObject, null, 4));
      console.log("Recieving from Dialogflow...");      
      const result = responses[0].queryResult;
      return sendTextMessage(userId, result.fulfillmentText);
    }).then(responses => {
      /*console.log("Sending buttons...");
      let buttons = [
               {
                "type":"postback",
                "payload":"data",
                "title":"Show all reminders"
              },  
              {
                "type":"postback",
                "payload":"data",
                "title":"Delete all reminders"
              }     
            ];            
            /*
        let button = [{
            "type":"web_url",
            "url":"https://petersapparel.parseapp.com",
            "title":"Show Website"
          }];
        */
      //return sendButtons(userId, "Choose options", buttons);
    })
    .catch(err => {
      console.error('!ERROR:', err);
    });
}

/*

curl -X POST -H "Content-Type: application/json" -d '{
  "setting_type":"call_to_actions",
  "thread_state":"new_thread",
  "call_to_actions":[
    {
      "payload":"Greeting"
    }
  ]
}' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAAJTOmYGRy4BAKEPdhgQVZAEuFPfRxYVdzScMC8UVFGPb2ejm0hahh6bw2wv7RZBqB7ymEVWRZAEwYwgEOd5cgzFIMJgyPVyBbFx656xm8Bgc227TKSZA6TfZAynNgix8nZCXG6sO1G33dXEXCsZCosj2UtXT4JisE4WFDPdE7YUwZDZD"

curl -X POST -H "Content-Type: application/json" -d '{
  "get_started": {"payload": "<postback_payload>"}
}'
 "https://graph.facebook.com/v2.6/me/messenger_profile?access_token=<PAGE_ACCESS_TOKEN>"

*/