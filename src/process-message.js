
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
var cache = { };
//2107839096000983
//353946818548326
const sessionClient = new dialogflow.SessionsClient(config);


const sendMessage = async (response, userId) => {
      console.log("Recieving from Dialogflow...");      
      const result = response.queryResult;
      //console.log(JSON.stringify(result, null, 4));
      if(result.action === constants.WELCOME_ACTION){
        console.log("-sendMessage welcome");
        let buttons = [facebookApi.generateButton(constants.CREATE_REMINDER),
        facebookApi.generateButton(constants.SHOW_ALL_REMINDERS)];
        let r = await facebookApi.sendButtons(userId, result.fulfillmentText, buttons);
      } else if(response.queryResult.action === constants.GET_REMINDERS){
        console.log("-sendMessage getAllReminders");
        reminder.sendAllReminders(userId);
      } else {
        console.log("sendMessage else", result.fulfillmentText);
        return facebookApi.sendTextMessage(userId, result.fulfillmentText);
      }     
      //console.log(JSON.stringify(response));
};

const getHookInputForDialogFlow = (event) => {
    if (event.message && event.message.text) {
      return event.message.text;
    } else if(event.postback && utils.isJSON(event.postback.payload)){
      let snoozeDoc = JSON.parse(event.postback.payload).SNOOZE_REMINDER;
      let acceptDoc = JSON.parse(event.postback.payload).ACCEPT_REMINDER;
      console.log("posback JSON: ", JSON.parse(event.postback.payload));
      console.log("posback JSON. snoozeDoc: ", snoozeDoc);
      console.log("posback JSON. acceptDoc: ", acceptDoc);
      if(snoozeDoc){
         let r = constants.SNOOZE_REMINDER + " " + snoozeDoc.reminderId;
         console.log("snooze doc: ", r);
         return r
      } else if(acceptDoc){
         let r = constants.ACCEPT_REMINDER + " " + acceptDoc.reminderId;
         console.log("accept doc: ", r);
         return r;
      }
    } else if(event.postback && event.postback.payload) {
      console.log("postback text payload: " + event.postback.payload);
      return event.postback.payload;
    } else {
      //console.log(JSON.stringify(event.postback));
      console.error("Unkown messenger hook");
      return null;
    }
    return null;
};



const handleActions = async (response, userId) => {
  console.log("handleActions");
  console.log("parameters: ", response.queryResult.parameters);
  console.log("action: " + response.queryResult.action);
  if( response.queryResult.action === constants.SET_REMINDER_ACTION && response.queryResult.allRequiredParamsPresent){
    let time = response.queryResult.parameters.fields.time.stringValue;
    let day = response.queryResult.parameters.fields.day.stringValue;
    let date = new Date(day.substring(0, 11) + time.substring(11)); 
    console.log("date string SET REMINDER: " + day.substring(0, 11) + time.substring(11));   
    await reminder.setReminder(userId, date);
  } else if(response.queryResult.action === constants.SNOOZE_ACTION && response.queryResult.parameters.fields.reminderId.stringValue) {
    console.log("HANDLE SNOOZE: ",  response.queryResult.parameters.fields.reminderId.stringValue);
    let reminderId = response.queryResult.parameters.fields.reminderId.stringValue;
    await reminder.snoozeReminder(reminderId);
  } else if(response.queryResult.action === constants.ACCEPT_ACTION && response.queryResult.parameters.fields.reminderId.stringValue) {
    console.log("HANDLE ACCEPT: ",  response.queryResult.parameters.fields.reminderId.stringValue);
    let reminderId = response.queryResult.parameters.fields.reminderId.stringValue;
    await reminder.removeReminder(reminderId);
  }
   //return response;
};

const initUserTimeZone = async (userId) => {
  if(!cache.userId){    
    cache[userId] = await facebookApi.getUserTimeZoneName(userId);     
  } 
  console.log(cache); 
}

module.exports.processHook = async (event) => {
  const userId = event.sender.id;
  const message = getHookInputForDialogFlow(event);
  const sessionPath = sessionClient.sessionPath(constants.PROJECT_ID, userId);

  if(message === null) return;
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
 
}