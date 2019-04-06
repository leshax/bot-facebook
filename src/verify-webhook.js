const constants = require('./constants');
const verifyWebhook = async (req, res) => {
  console.log("webhook");
  let mode = req.query[constants.HUB_MODE];
  let token = req.query[constants.HUB_TOKEN];
  let challenge = req.query[constants.HUB_CHALLENGE];
  console.log(mode);
  console.log(token);
  console.log(challenge);
  if (mode && token === constants.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

module.exports = verifyWebhook;