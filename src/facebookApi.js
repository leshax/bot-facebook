var constants = require('./constants');
const fetch = require('node-fetch');
const { FACEBOOK_ACCESS_TOKEN } = process.env;
const { GOOGLE_API } = process.env;

/**
 * Sends a message with buttons via facebook api
 * @param {string} userId - Facebook user id
 * @param {string} text - Text of a message
 * @return {array} buttons - Attached buttons
 */
const sendButtons = (userId, text, buttons) => {
  return fetch(
    `https://graph.facebook.com/v2.6/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`, {
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
            "type": "template",
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

/**
 * Sends a generic template via facebook api
 * @param {string} userId - Facebook user id
 * @param {string} title - Title of a message
 * @param {string} subtitle - Subtitle of a message
 * @param {string} pic_url - Picture url of generic template
 * @param {array} buttons - Buttons for generic template
 * @return {promise} Fetch result as a promise
 */
const sendGenericTemplate = (userId, title, subtitle, pic_url, buttons) => {
  return fetch(
    `https://graph.facebook.com/v2.6/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`, {
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
            "type": "template",
            "payload": {
              "template_type": "generic",
              "elements": [{
                "title": title,
                "image_url": pic_url,
                "subtitle": subtitle,
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
    console.error("sendGenericTemplate", error)
  });
};

/**
 * Sends a text message via facebook api
 * @param {string} userId - Facebook user id
 * @param {string} text - Text of a message
 * @return {promise} Fetch result as a promise
 */
const sendTextMessage = (userId, text) => {
  console.log("sendTextMessage: " + text);
  return fetch(
    `https://graph.facebook.com/v2.6/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`, {
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
    console.error("sendTextMessage: ", error)
  });
};

/**
 * Generates a button for a facebook message
 * @param {string} text - Text of a button
 * @param {string} payload - JSON.stringified object of a payload.
 * @return {object} button - Button object
 */
const generateButton = (text, payload) => {
  payload = payload ? payload : text;
  return {
    "type": constants.POSTBACK_BUTTON_TYPE,
    "payload": payload,
    "title": text
  }
};

/**
 * Recieves a user location by a facebook user id from facebook api
 * @param {string} userId - Facebook user id
 * @return {object} location - Location object
 */
const getLocationByUserId = (userId) => {
  return fetch(
    `https://graph.facebook.com/v2.11/${userId}?fields=location&access_token=${FACEBOOK_ACCESS_TOKEN}`, {
      headers: {
        'Content-Type': constants.CONTENT_TYPE.JSON,
      },
      method: 'GET'
    }).then(res => res.json());
}

/*
const getOffsetByUserId = (userId) => {
  return fetch(
    `https://graph.facebook.com/v2.8/${userId}?fields=timezone&access_token=${FACEBOOK_ACCESS_TOKEN}`, {
      headers: {
        'Content-Type': constants.CONTENT_TYPE.JSON,
      },
      method: 'GET'
    }).then(res => res.json());
};*/


/**
 * Recieves a user timezone name by location(lat/lon) 
 * @param {string} latitude - Latitude
 * @param {string} longitude - Longitude
 * @return {obejct} timezone name - Location object 
 */
const getTimezoneByCoordinates = (latitude, longitude) => {
  return fetch(
    `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=1331161200&key=${GOOGLE_API}`, {
      headers: {
        'Content-Type': constants.CONTENT_TYPE.JSON,
      },
      method: 'GET'
    }).then(res => res.json());
}

/**
 * Gets a time zone name by user location 
 * If user location is unknown returns default time zone 
 * @param {string} userId - Facebook user id
 * @return {obejct} timezone - Timezone object 
 */
const getUserTimeZoneName = async (userId) => {
  var timezone;
  var isDefaultValue = true;
  try {
    let location = await getLocationByUserId(userId);
    //50.4501,30.5234
    //console.log(await facebookApi.getTimezoneByCoordinates(50.4501, 30.5234))  
    if (location.latitude && location.latitude) {
      timezone = await getTimezoneByCoordinates(location.latitude, location.longitude);
      isDefaultValue = false;
    } else {
      timezone = constants.DEFAULT_TIMEZONE;
    }
    return {
      "timezone": timezone,
      "isDefaultValue": isDefaultValue
    };
  } catch (e) {
    console.error("getUserTime error: ", e);
    return {
      "timezone": constants.DEFAULT_TIMEZONE,
      "isDefaultValue": isDefaultValue
    };
  }
}
return module.exports = {
  sendTextMessage: sendTextMessage,
  sendButtons: sendButtons,
  generateButton: generateButton,
  //getOffsetByUserId: getOffsetByUserId,
  getLocationByUserId: getLocationByUserId,
  getTimezoneByCoordinates: getTimezoneByCoordinates,
  sendGenericTemplate: sendGenericTemplate,
  getUserTimeZoneName: getUserTimeZoneName
};