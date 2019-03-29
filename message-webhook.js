const processMessage = require('./process-message');
module.exports = (req, res) => {
  console.log("HOOK!");
  if (req.body.object === 'page') {
    //console.log("-", req.body.object);
    req.body.entry.forEach(entry => {
      //console.log("--", JSON.stringify(entry));
      entry.messaging.forEach(event => {
        if (event.message && event.message.text) {
          console.log("---", "processMessage");
          processMessage(event);
        } else if(event.postback && event.postback.payload === "Greeting") {
          console.log("---", "greetingMessage");
          //processGreeting(event);
        }
      });
    });
    res.status(200).end();
  }
};