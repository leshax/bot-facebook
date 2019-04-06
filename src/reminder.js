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
	}).catch(error => {
		console.error("snoozeReminder", error)
	});;
};

const getAllReminders = async (userId) => {
  console.log('--get getAllReminders start:')
  let result = await collection.where('userId', '==', userId).get();
  if(result.empty) return null;
  result.forEach(function (documentSnapshot) {
	  var data = documentSnapshot.data();
	  console.log("getAllReminders data", data);
  });
  return result;
};

const getRemindersToFire = async () => {
  console.log('--getRemindersToFire start:');
  let result = await collection.where('time', '>', new Date()).get();
  if(result.empty) return null;
  result.forEach(function (documentSnapshot) {
	  var data = documentSnapshot.data();
	  console.log("getRemindersToFire:", data);
  });
  return result;
};

const handleRemindersMessage = async (reminders, showButtons) => {
	reminders.forEach(async (reminder) => {             
	    var data = reminder.data();
	    var fired = data.fired;
	    var buttons = null;
	    var userId = data.userId;	              
	    var reminderId = reminder.id;
	    console.log('id: ', reminderId);
	    console.log('data sendMessage: ', data);
	    var miliseconds = data.time._seconds*1000;
	    var time =  new Date(miliseconds);
	    //const sendGenericTemplate = (title, subtitle, pic_url, buttons) => {          
	    console.log('data time: ', new Date(data.time._seconds*1000));
	    console.log('userId ', userId);    
	    var timezoneName = await facebookApi.getUserTimeZoneName(userId);
	    //let options = {"timeZone": timezoneName, "hour12": false, "year": "numeric", "month":"2-digit","day":"2-digit"};
	    var optionsShort = {"timeZone": timezoneName.timezone, "hour12": false, "hour":"2-digit", "minute":"2-digit" };
		var optionsFull = {"timeZone": timezoneName.timezone, "hour12": false };
	    var localMinutes = time.toLocaleString("en-US", optionsShort);
	    var localTimeStr = time.toLocaleString("en-US", optionsFull);
	    console.log("localTimeStr", localTimeStr);
	    console.log("localTimeMinutes", localTimeStr);
		if(showButtons){
			console.log("showButtons: " + showButtons);		    
		    let acceptPayload = JSON.stringify({ "ACCEPT_REMINDER": { "userId": userId, "time": time, "reminderId" : reminderId } });
		    let snoozePaypload = JSON.stringify({ "SNOOZE_REMINDER": { "userId": userId, "time": time, "reminderId" : reminderId} });
		    buttons = [facebookApi.generateButton(constants.ACCEPT_REMINDER, acceptPayload),
	    	facebookApi.generateButton(constants.SNOOZE_REMINDER, snoozePaypload)];
		}
	    let debugInfo = "[DEBUG] UserLocalTime: " + localTimeStr + ", " + fired + ", " + timezoneName.timezone; 
	    await facebookApi.sendGenericTemplate(userId, "Reminder at " + localMinutes, debugInfo, constants.ALARM_IMG_LINK, buttons);
  });
}

const sendAllReminders = async (userId) => {
  let reminders = await getAllReminders(userId);
  if(!reminders){
  	await facebookApi.sendTextMessage(userId, constants.EMPTY_LIST);
  	return constants.EMPTY_LIST;
  }     
  await handleRemindersMessage(reminders, false)
};

const sendToFireReminders = async () => {
  let reminders = await getRemindersToFire();
  console.log("sendToFireReminders: " + sendToFireReminders);
  if(reminders){
  	await handleRemindersMessage(reminders, true);
  }      
};

return module.exports = {
	setReminder: setReminder,
	getAllReminders: getAllReminders,
	sendAllReminders: sendAllReminders,
	removeReminder: removeReminder,
	snoozeReminder: snoozeReminder,
	sendToFireReminders: sendToFireReminders
};