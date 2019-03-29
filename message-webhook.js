const handleMessage = require('./process-message');
module.exports = (req, res) => {
  console.log("HOOK!");
  if (req.body.object === 'page') {
    //console.log("-", req.body.object);
    req.body.entry.forEach(entry => {
      //console.log("--", JSON.stringify(entry));
      entry.messaging.forEach(event => {
          handleMessage.processHook(event);
      });
    });
    res.status(200).end();
  }
};