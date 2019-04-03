var admin = require("firebase-admin");
var serviceAccount = require("./firestore.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DB_URL,
});
var db = admin.firestore();
var collection = db.collection('reminders');

const setReminder = async (userId, time) => {
	let id = userId + "-" + time.getTime();	
	await docRef.doc(id).set({
	  userId: userId,
	  time: time,
	  fired: false
	});
};

const getUnfiredReminders = async (userId) => {
  console.log('--get Reminders start:')
  let result = await collection.where('time', '<', new Date()).get();
  if(result.empty) return null;
  //where('fired', '==', false)
  result.forEach(function (documentSnapshot) {
  var data = documentSnapshot.data();
  	console.log("getUnfiredReminders:", data);
  });
 /*
  console.log('--get Reminders finish: ');
  result.forEach(function (documentSnapshot) {
  	let data = documentSnapshot.data();
  	console.log("data", data);
  });

  console.log('--get Reminders finish 3: ');
  */
  return result;
};

return module.exports = {
	setReminder: setReminder,
	getUnfiredReminders: getUnfiredReminders
};