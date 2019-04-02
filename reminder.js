var admin = require("firebase-admin");
var serviceAccount = require("./firestore.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DB_URL,
});
var db = admin.firestore();
var docRef = db.collection('reminders');

const setReminder = async (userId, time) => {	
	await docRef.add({
	  userId: userId,
	  time: time,
	  fired: false
	});
};

const getReminders = async (userId) => {
  console.log('--get Reminders start:')
  let result = await docRef.where('userId', '==', userId).get();
  if(result.empty) return null;
  result.forEach(function (documentSnapshot) {
  var data = documentSnapshot.data();
  	console.log("data", data);
  });
 
  //console.log('--get Reminders finish:', docs)
  return result;
};

return module.exports = {
	setReminder: setReminder,
	getReminders: getReminders
};