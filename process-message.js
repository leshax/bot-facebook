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

module.exports.processGreeting = (event) => {
  const userId = event.sender.id;
  const message = "Greetings! Choose an option to continue."

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
      console.log("Sending buttons...");
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
      return sendButtons(userId, "Choose options", buttons);
    })
    .catch(err => {
      console.error('ERROR: processGreeting', err);
    });
}

module.exports.processMessage = (event) => {
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
    })
    .catch(err => {
      console.error('!ERROR:', err);
    });
}

/*



*/