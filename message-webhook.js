const handleMessage = require('./process-message');

module.exports = async (req, res) => {
  console.log("HOOK!");
  if (req.body.object === 'page') {
    //console.log("-", req.body.object);
     //console.dir(entry, {depth: null});
    req.body.entry.forEach(entry => {
      //console.log("--", JSON.stringify(entry));

      entry.messaging.forEach(event => {          
          handleMessage.processHook(event);
      });
    });
    res.status(200).end();
  }
};