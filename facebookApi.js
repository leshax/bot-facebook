var constants = require('./constants');
const fetch = require('node-fetch');
const { FACEBOOK_ACCESS_TOKEN } = process.env;
const { GOOGLE_API } = process.env;
const sendButtons = (userId, text, buttons) => {
   return fetch(
    `https://graph.facebook.com/v2.6/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`,
    {
      headers: {
        'Content-Type': constants.CONTENT_TYPE.JSON,
      },
      method: 'POST',
      body: JSON.stringify({
        messaging_type: constants.RESPONSE_MESSAGE_TYPE,
        recipient: {
          id: userId,
        },
        message: {
          "attachment": {
            "type":"template",
            "payload": {
              "template_type": constants.BUTTON_TEMPLATE_TYPE,
              "text": text,
              "buttons": buttons
          }
        }
      }
    }),
  }); 
};



const sendGenericTemplate = (userId, title, subtitle, pic_url, buttons) => {
	return fetch(
    `https://graph.facebook.com/v2.6/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`,
    {
    	headers: {
    		'Content-Type': constants.CONTENT_TYPE.JSON,
    	},
    	method: 'POST',
    	body: JSON.stringify({        	
        	recipient: {
          		id: userId,
        	},
	        message: {
	        	"attachment": {
		            "type":"template",
		            "payload": {
	  					"template_type":"generic",
			 			"elements":[{
			      			"title":title,
			      			"image_url":pic_url,
			      			"subtitle":subtitle,
			      			"default_action": {
			       				"type": "web_url",
			        			"url": "http://www.google.com",
			        			"messenger_extensions": false,
			        			"webview_height_ratio": "full"
			      			},
			    			"buttons": buttons     
			    		}]
					}
	      		}
	    	}
		})
	}).catch(error => {
		console.log("error", error)
	}); 
};

const sendTextMessage = (userId, text) => {
  console.log("sendTextMessage");
  return fetch(
    `https://graph.facebook.com/v2.6/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`,
    {
      headers: {
        'Content-Type': constants.CONTENT_TYPE.JSON,
      },
      method: 'POST',
      body: JSON.stringify({
        messaging_type: constants.RESPONSE_MESSAGE_TYPE,
        recipient: {
          id: userId,
        },
        message: {
         "text": text
        }
      }),
    }
  ).catch(error => {
	console.log("error", error)
  });
};

const generateButton = (text, payload) => {
  payload = payload ? payload : text;
  return  {
    "type": constants.POSTBACK_BUTTON_TYPE,
    "payload": payload,
    "title": text
  }  
};

const getLocationByUserId = (userId) => {
 	return fetch(
    `https://graph.facebook.com/v2.11/${userId}?fields=location&access_token=${FACEBOOK_ACCESS_TOKEN}`,
    {
      headers: {
        'Content-Type': constants.CONTENT_TYPE.JSON,
      },
      method: 'GET'
    }).then(res => res.json());	
}


const getOffsetByUserId = (userId) => {
  return fetch(
    `https://graph.facebook.com/v2.8/${userId}?fields=timezone&access_token=${FACEBOOK_ACCESS_TOKEN}`,
    {
      headers: {
        'Content-Type': constants.CONTENT_TYPE.JSON,
      },
      method: 'GET'
    }).then(res => res.json());
};

const getTimezoneByCoordinates = (latitude, longitude) =>{
 // Google Time Api requires some timestamp to provide timezone name by coordinates.
	return fetch(
    `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=1331161200&key=${GOOGLE_API}`,
    {
      headers: {
        'Content-Type': constants.CONTENT_TYPE.JSON,
      },
      method: 'GET'
    }).then(res => res.json());
}

return module.exports = {
	sendTextMessage: sendTextMessage,
	sendButtons: sendButtons,
	generateButton: generateButton,
	getOffsetByUserId: getOffsetByUserId,
	getLocationByUserId: getLocationByUserId,
	getTimezoneByCoordinates: getTimezoneByCoordinates,
	sendGenericTemplate: sendGenericTemplate
};