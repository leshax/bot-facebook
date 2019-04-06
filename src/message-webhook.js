const handleMessage = require('./process-message');
const reminder = require('./reminder');

/**
 * Catches facebook message event
 * @param {object} req - Express req object
 * @param {object} res - Express res object
 */
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

/**
 * Cron job trigger. Entry point to detect ready reminders.
 * @param {object} req - Express req object
 * @param {object} res - Express res object
 */
const tick = async (req, res) => {
  try {
    await reminder.sendToFireReminders();
    res.status(200).end();
  } catch (e) {
    console.error('tick', e);
    res.status(400).end();
  }
}

/*
*
* Simulation of tick function for no-HTTP calls
*
*/
const internalTick = async () => {
  try {
    await reminder.sendToFireReminders();
  } catch (e) {
    console.error('tick', e);
  }
}

module.exports = {
  internalTick: internalTick,
  tick: tick,
  webhook: webhook
}