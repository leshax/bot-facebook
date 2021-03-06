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

/**
 * Save a reminder object to database.
 * @param {string} userId - Facebook user id
 * @param {date} time - Reminder time
 */
const setReminder = async (userId, time) => {
  let id = userId + time.getTime();
  await collection.doc(id).set({
    userId: userId,
    time: time,
    fired: false
  });
};

/**
 * Removes a reminder from a database.
 * @param {string} reminderId - Reminder id
 */
const removeReminder = async (reminderId) => {
  await db.collection("reminders").doc(reminderId).delete().catch(error => {
    console.error("removeReminder", error)
  });
};

/**
 * Reschedule reminder. Adds 1 minute to a time object.
 * @param {string} reminderId - Reminder id
 */
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

/**
 * Get all reminders for specific user
 * @param {string} userId - Facebook user id
 * @return {object} reminders - User reminders
 */
const getAllReminders = async (userId) => {
  console.log('--get getAllReminders start:')
  let result = await collection.where('userId', '==', userId).get();
  if (result.empty) return null;
  result.forEach(function(documentSnapshot) {
    var data = documentSnapshot.data();
    console.log("getAllReminders data", data);
  });
  return result;
};

/**
 * Get all reminders to be fired 
 * @return {object} reminders - User reminders
 */
const getRemindersToFire = async () => {
  console.log('--getRemindersToFire start:');
  let result = await collection.where('time', '<', new Date()).get();
  if (result.empty) return null;
  result.forEach(function(documentSnapshot) {
    var data = documentSnapshot.data();
    console.log("getRemindersToFire:", data);
  });
  return result;
};

/**
 * Generates data for a generic template
 * @param {object} reminders - Facebook user id
 * @param {bool} showButtons - Defines if buttons should be attached to a generic template
 */
const handleRemindersMessage = async (reminders, showButtons) => {
  reminders.forEach(async (reminder) => {
    var data = reminder.data();
    var fired = data.fired;
    var buttons = null;
    var userId = data.userId;
    var reminderId = reminder.id;
    console.log('id: ', reminderId);
    console.log('data sendMessage: ', data);
    var miliseconds = data.time._seconds * 1000;
    var time = new Date(miliseconds);          
    console.log('data time: ', new Date(data.time._seconds * 1000));
    console.log('userId ', userId);
    var timezoneName = await facebookApi.getUserTimeZoneName(userId);
    console.log("Timezone name: ", timezoneName);
    var optionsShort = getShortTime(timezoneName.timezone);    
    var optionsFull = getExtendedTime(timezoneName.timezone);     
    var localMinutes = time.toLocaleString("en-US", optionsShort);
    var localTimeStr = time.toLocaleString("en-US", optionsFull);
    console.log("localTimeStr", localTimeStr);
    console.log("localTimeMinutes", localTimeStr);
    if (showButtons) {
      console.log("showButtons: " + showButtons);
      let acceptPayload = facebookApi.generatePayload("ACCEPT_REMINDER", userId, time, reminderId);
      let snoozePayload = facebookApi.generatePayload("SNOOZE_REMINDER", userId, time, reminderId);
      console.log('acceptPayload', acceptPayload);
      console.log('snoozePayload', snoozePayload);
      buttons = [facebookApi.generateButton(constants.ACCEPT_REMINDER, acceptPayload),
        facebookApi.generateButton(constants.SNOOZE_REMINDER, snoozePayload)
      ];
    }
    let debugInfo = "[DEBUG] UserLocalTime: " + localTimeStr + ", " + fired + ", " + timezoneName.timezone;
    console.log("handleRemindersMessage userId", userId);
    console.log("handleRemindersMessage reminderId", reminderId);
    await facebookApi.sendGenericTemplate(userId, "Reminder at " + localMinutes, debugInfo, constants.ALARM_IMG_LINK, buttons);
  });
};

/**
 * Get options for toLocaleString() for full time representation
 * @param {string} timezone - ex. Europe/Warsaw
 * @return {string} timezone - full time format options
 */
const getExtendedTime = (timezone) => {
	return {		
      "timeZone": timezone,
      "hour12": false,
      "hour": "2-digit",
      "minute": "2-digit"
	}
};

/**
 * Get options for toLocaleString() for short time representation
 * @param {string} timezone - ex. Europe/Warsaw
 * @return {string} timezone - short time format options
 */
const getShortTime = (timezone) => {
	return {		
      "timeZone": timezone,
      "hour12": false
	}
};

/**
 * Quering all reminders by userId and send them to a specific user.
 * @param {string} userId - Facebook user id
 */
const sendAllReminders = async (userId) => {
  let reminders = await getAllReminders(userId);
  if (!reminders) {
    await facebookApi.sendTextMessage(userId, constants.EMPTY_LIST);
    return constants.EMPTY_LIST;
  }
  await handleRemindersMessage(reminders, false)
};

/**
 * Quering all ready reminders and send them to all related users.
 * @param {string} userId - Facebook user id
 */
const sendToFireReminders = async () => {
  let reminders = await getRemindersToFire();
  console.log("sendToFireReminders: " + reminders);
  if (reminders) {
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