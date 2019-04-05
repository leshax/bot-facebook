var admin = require("firebase-admin");
var serviceAccount = require("./firestore.json");
var facebookApi = require("./facebookApi");
var constants = require("./constants");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DB_URL,
});
var db = admin.firestore();
var collection = db.collection('reminders');

const setReminder = async (userId, time) => {
	let id = userId + time.getTime();
	await collection.doc(id).set({
	  userId: userId,
	  time: time,
	  fired: false
	});
};

const removeReminder = async (reminderId) => {
 	await db.collection("reminders").doc(reminderId).delete().catch(error => {
		console.error("removeReminder", error)
	});
};

const snoozeReminder = async (reminderId) => {
	let reminder = await db.collection("reminders").doc(reminderId).get();
	let oldDate = new Date(reminder.data().time._seconds * 1000);
	let newDate = new Date(oldDate.setTime(oldDate.getTime() + 1000 * 60));
    await db.collection("reminders").doc(reminderId).update({
    	time: newDate
	});
};

const getReminders = async (userId) => {
  console.log('--get Reminders start:')
  let result = await collection.where('userId', '==', userId).get();
  if(result.empty) return null;
  //where('fired', '==', false)
  result.forEach(function (documentSnapshot) {
	  var data = documentSnapshot.data();
	  console.log("getUnfiredReminders:", data);
  });
  return result;
};

const getRemindersToday = async (userId) => {
  console.log('--get Reminders start:')
  let result = await collection.where('userId', '==', userId).get();
  if(result.empty) return null;
  //where('fired', '==', false)
  result.forEach(function (documentSnapshot) {
	  var data = documentSnapshot.data();
	  console.log("getUnfiredReminders:", data);
  });
  return result;
};

const sendReminders = async (userId) => {
  let reminders = await getReminders(userId);
  if(!reminders){
  	await facebookApi.sendTextMessage(userId, constants.EMPTY_LIST);
  	return constants.EMPTY_LIST;
  }     
  reminders.forEach(async (reminder) => {             
    let data = reminder.data();
    let fired = data.fired;
    if(fired) return;             
    let reminderId = reminder.id;
    console.log('id: ', reminderId);
    console.log('data sendMessage: ', data);
    let miliSeconds = data.time._seconds*1000;
    let time =  new Date(miliSeconds);
    //const sendGenericTemplate = (title, subtitle, pic_url, buttons) => {          
    console.log('data time: ', new Date(data.time._seconds*1000));
    console.log('userId ', userId);    
    let timezoneName = await facebookApi.getUserTimeZoneName(userId);
    //let options = {"timeZone": timezoneName, "hour12": false, "year": "numeric", "month":"2-digit","day":"2-digit"};
    let optionsShort = {"timeZone": timezoneName.timezone, "hour12": false, "hour":"2-digit", "minute":"2-digit" };
    let optionsFull = {"timeZone": timezoneName.timezone, "hour12": false };
    let localMinutes = time.toLocaleString("en-US", optionsShort);
    let localTimeStr = time.toLocaleString("en-US", optionsFull);
    console.log("localTimeStr", localTimeStr);
    console.log("localTimeMinutes", localTimeStr);
    let acceptPayload = JSON.stringify({ "ACCEPT_REMINDER": { "userId": userId, "time": time, "reminderId" : reminderId } });
    let snoozePaypload = JSON.stringify({ "SNOOZE_REMINDER": { "userId": userId, "time": time, "reminderId" : reminderId} });
    let buttons = [facebookApi.generateButton(constants.ACCEPT_REMINDER, acceptPayload),
    facebookApi.generateButton(constants.SNOOZE_REMINDER, snoozePaypload)];
    let debugInfo = "[DEBUG] UserLocalTime: " + localTimeStr + ", " + fired + ", " + timezoneName.timezone; 
    await facebookApi.sendGenericTemplate(userId, "Reminder at " + localMinutes, debugInfo, constants.ALARM_IMG_LINK, buttons);
  });
};

return module.exports = {
	setReminder: setReminder,
	getReminders: getReminders,
	sendReminders: sendReminders,
	removeReminder: removeReminder,
	snoozeReminder: snoozeReminder
};