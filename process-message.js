
const dialogflow = require('dialogflow');
const constants = require('./constants');
const facebookApi = require('./facebookApi'); 
const config = {
  credentials: {
    private_key: process.env.DIALOGFLOW_PRIVATE_KEY,
    client_email: process.env.DIALOGFLOW_CLIENT_EMAIL
  }
};
var userCache = { };
//2107839096000983
//353946818548326
const sessionClient = new dialogflow.SessionsClient(config);

const sendMessage = (response, userId) => {
      console.log("Recieving from Dialogflow...");      
      const result = response.queryResult;
      //console.log(JSON.stringify(result, null, 4));
      if(result.action === constants.WELCOME_ACTION){
        var buttons = [facebookApi.generateButton(constants.CREATE_REMINDER),
         facebookApi.generateButton(constants.SHOW_ALL_REMINDERS)];
        return facebookApi.sendButtons(userId, result.fulfillmentText, buttons);
      } else {
        console.log("sendMessage...", userId, result.fulfillmentText);
        return facebookApi.sendTextMessage(userId, result.fulfillmentText);
      }     
      //console.log(JSON.stringify(response));
};

const getHookInputForDialogFlow = (event) => {
    if (event.message && event.message.text) {
      return event.message.text;
    } else if(event.postback && event.postback.payload) {
      return event.postback.payload;
    } else {
      //console.log(JSON.stringify(event.postback));
      console.error("Unkown messenger hook");
      return null;
    }
};

const getUserTimeZoneName = async(userId) => {
  var timezone;
  let location = await facebookApi.getLocationByUserId(userId);
  //50.4501,30.5234
  console.log(await facebookApi.getTimezoneByCoordinates(50.4501, 30.5234))  
  if(location.latitude && location.latitude){
    timezone = await facebookApi.getTimezoneByCoordinates(location.latitude, location.longitude);
  } else {
     timezone = constants.DEFAULT_TIMEZONE;
  }
  return timezone
}
const setReminder = async (response, userId) => {
  





  //console.log(time);
  return response;
  //console.dir(timezone);
}

const handleReminderActions = async (response, userId) => {
  console.log("handleReminderActions");
  console.log(response.queryResult.parameters);
  //return response;
  if(isReminderInfoReady(response)){  
    await setReminder(response, userId);
  } else {
   
  }
   //return response;
};


const isConversationFinished = (response) => {  
  
  if(response.queryResult.diagnosticInfo &&
    response.queryResult.diagnosticInfo.fields &&
    response.queryResult.diagnosticInfo.fields.end_conversation.boolValue) {
    /*
    console.log("response.queryResult.diagnosticInfo" ,response.queryResult.diagnosticInfo);
    console.log("response.queryResult.diagnosticInfo.fields", response.queryResult.diagnosticInfo.fields);
    console.log("response.queryResult.diagnosticInfo.fields.end_converstion.boolValue", response.queryResult.diagnosticInfo.fields.end_conversation.boolValue);
    console.log("isConversationFinished", true);
    */
    return true;
  } else {
    /*console.log("response.queryResult.diagnosticInfo" ,response.queryResult.diagnosticInfo);
    console.log("response.queryResult.diagnosticInfo.fields", response.queryResult.diagnosticInfo.fields);
    console.log("response.queryResult.diagnosticInfo.fields.end_converstion.boolValue", response.queryResult.diagnosticInfo.fields.end_conversation.boolValue);
    console.log("isConversationFinished", false);*/
    return false;
  }
} 

const isReminderInfoReady = (response) => {
  console.log("isReminderInfoReady response.queryResult.action" , response.queryResult.action);
  console.log("isReminderInfoReady response.queryResult.action " , response.queryResult.action);
  console.log("isReminderInfoReady isConversationFinished" , isConversationFinished(response));
  //console.dir(response);
  if(response.queryResult.action === constants.SET_REMINDER_ACTION 
    && response.queryResult.allRequiredParamsPresent 
    && isConversationFinished(response)){
    console.log("isReminderInfoReady" , true);
    return true;
  } else {
    console.log("isReminderInfoReady" , false);
    return false;
  }
}
/*
const getUserTimeZone = async (userId) => {
  if(userCache[userId]){
    return userCache[userId];
  } else {
    return await facebookApi.getTimeZoneByUserId(userId);
  }
}
*/
module.exports.processHook = async (event) => {
  const userId = event.sender.id;
  const message = getHookInputForDialogFlow(event);
  const sessionPath = sessionClient.sessionPath(constants.PROJECT_ID, userId);

  if(message === null) return;

  let timezone = await getUserTimeZoneName(userId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: constants.LANGUAGE_CODE,
      }      
    },
    queryParams: {
        timeZone: timezone
    }
  };
  try {
    let responses = await sessionClient.detectIntent(request);
    await handleReminderActions(responses[0], userId);
    await sendMessage(responses[0], userId);
  } catch (e) {
    console.error(constants.PROCESS_HOOK_ERROR)
    console.dir(e);
  }
 
}