const verifyWebhook = (req, res) => {
      console.log("webhook");
      let VERIFY_TOKEN = 'marker';

      let mode = req.query['hub.mode'];
      let token = req.query['hub.verify_token'];
      let challenge = req.query['hub.challenge'];
      console.log(mode);
      console.log(token);
      console.log(challenge);
      if (mode && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    };

module.exports = verifyWebhook;