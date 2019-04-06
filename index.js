require('dotenv').config({
  path: 'variables.env'
});
//4455
const messageWebhook = require('./src/message-webhook');
const express = require('express');
const bodyParser = require('body-parser');
const verifyWebhook = require('./src/verify-webhook');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', (req, res) => res.send('Hello World!'));
app.get('/tick', messageWebhook.tick)
app.get('/webhook', verifyWebhook);
app.post('/webhook', messageWebhook.webhook);

app.listen(8080, () => console.log('Express server is listening on port 8080'));

/*
	TODO: 
	Use Google Cloud Scheduler to schedule reminder check instead, so we can scale vertically.
*/
messageWebhook.internalTick();
setInterval(function() {
	//console.log("Tick!");
	//await messageWebhook.tick();
}, 10 * 1000);
