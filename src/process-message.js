const dialogflow = require('dialogflow');
const constants = require('./constants');
const facebookApi = require('./facebookApi');
const reminder = require('./reminder');
const utils = require('./utils');

const config = {
  credentials: {
    private_key: process.env.DIALOGFLOW_PRIVATE_KEY,
    client_email: process.env.DIALOGFLOW_CLIENT_EMAIL
  }
};
var cache = {}; 

const sessionClient = new dialogflow.SessionsClient(config);

/**
 * Permorms all activities related to facebook response after dialogflow analysis
 * @param {object} response - Dialogflow response object
 * @param {string} userId - facebook user id
 */
const sendMessage = async (response, userId) => {
  console.log("Recieving from Dialogflow...");
  console.log("Sending to... " + userId);

  const result = response.queryResult;
  //console.log(JSON.stringify(result, null, 4));
  if (result.action === constants.WELCOME_ACTION) {
    console.log("-sendMessage welcome: " + userId);
    let buttons = [facebookApi.generateButton(constants.CREATE_REMINDER),
      facebookApi.generateButton(constants.SHOW_ALL_REMINDERS)
    ];
    let r = await facebookApi.sendButtons(userId, result.fulfillmentText, buttons);
  } else if (response.queryResult.action === constants.GET_REMINDERS) {
    console.log("-sendMessage getAllReminders");
    reminder.sendAllReminders(userId);
  } else {
    console.log("sendMessage else", result.fulfillmentText);
    facebookApi.sendTextMessage(userId, result.fulfillmentText);
  }
  //console.log(JSON.stringify(response));
};

/**
 * Returns a message for dialog flow analysis after facebook event hook
 * @param {object} event - Facebook hook object
 * @return {string} text - Text for dialog flow for analysis
 */
const getHookInputForDialogFlow = (event) => {
  if (event.message && event.message.text) {
    return event.message.text;
  } else if (event.postback && utils.isJSON(event.postback.payload)) {
    let snoozeDoc = JSON.parse(event.postback.payload).SNOOZE_REMINDER;
    let acceptDoc = JSON.parse(event.postback.payload).ACCEPT_REMINDER;
    console.log("posback JSON: ", JSON.parse(event.postback.payload));
    console.log("posback JSON. snoozeDoc: ", snoozeDoc);
    console.log("posback JSON. acceptDoc: ", acceptDoc);
    if (snoozeDoc) {
      return constants.SNOOZE_REMINDER + " " + snoozeDoc.reminderId;
    } else if (acceptDoc) {      
      return constants.ACCEPT_REMINDER + " " + acceptDoc.reminderId;
    }
  } else if (event.postback && event.postback.payload) {
    console.log("postback text payload: " + event.postback.payload);
    return event.postback.payload;
  } else {
    //console.log(JSON.stringify(event.postback));
    console.error("Unkown messenger hook");
    return null;
  }
  return null;
};


/**
 * Permorms all activities related to internal changes like database updates.
 * @param {object} response - Dialogflow response object
 * @param {string} userId - Facebook user id
 */
const handleActions = async (response, userId) => {
  console.log("handleActions");
  console.log("parameters: ", response.queryResult.parameters);
  console.log("action: " + response.queryResult.action);
  if (response.queryResult.action === constants.SET_REMINDER_ACTION && response.queryResult.allRequiredParamsPresent) {
    let time = response.queryResult.parameters.fields.time.stringValue;
    let day = response.queryResult.parameters.fields.day.stringValue;
    let date = new Date(day.substring(0, 11) + time.substring(11));
    console.log("date string SET REMINDER: " + day.substring(0, 11) + time.substring(11));
    await reminder.setReminder(userId, date);
  } else if (response.queryResult.action === constants.SNOOZE_ACTION && response.queryResult.parameters.fields.reminderId.stringValue) {
    console.log("HANDLE SNOOZE: ", response.queryResult.parameters.fields.reminderId.stringValue);
    let reminderId = response.queryResult.parameters.fields.reminderId.stringValue;
    await reminder.snoozeReminder(reminderId);
  } else if (response.queryResult.action === constants.ACCEPT_ACTION && response.queryResult.parameters.fields.reminderId.stringValue) {
    console.log("HANDLE ACCEPT: ", response.queryResult.parameters.fields.reminderId.stringValue);
    let reminderId = response.queryResult.parameters.fields.reminderId.stringValue;
    await reminder.removeReminder(reminderId);
  }
  //return response;
};

/**
 * Cache user timezone name.
 * @param {string} userId - Facebook user id
 */
const initUserTimeZone = async (userId) => {
  if (!cache.userId) {
    cache[userId] = await facebookApi.getUserTimeZoneName(userId);
  }
  console.log(cache);
};

/**
 * Transfers message to dialogflow
 * @param {object} event - facebook message event 
 */
module.exports.processHook = async (event) => {
  const userId = event.sender.id;
  console.log("processHook", userId);
  const message = getHookInputForDialogFlow(event);
  const sessionPath = sessionClient.sessionPath(constants.PROJECT_ID, userId);

  if (message === null) return;
  console.log("message: " + message);

  await initUserTimeZone(userId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: constants.LANGUAGE_CODE,
      }
    },
    queryParams: {
      timeZone: cache[userId].timezone
    }
  }; 
  try {
    let responses = await sessionClient.detectIntent(request);
    await handleActions(responses[0], userId);
    await sendMessage(responses[0], userId);
  } catch (e) {
    console.error(constants.PROCESS_HOOK_ERROR)
    console.dir(e);
  }

};