const handleMessage = require('./process-message');
const reminder = require('./reminder');

const webhook = async (req, res) => {
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

const tick = async (req, res) => {
  try {
    await reminder.sendToFireReminders();
    res.status(200).end();
  } catch (e) {
    console.error('tick', error);
    res.status(400).end();
  }
}

module.exports = {
  tick: tick,
  webhook: webhook
}