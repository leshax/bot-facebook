require('dotenv').config({ path: 'variables.env' });

const messageWebhook = require('./message-webhook');
const express = require('express');
const bodyParser = require('body-parser');
const verifyWebhook = require('./verify-webhook');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => res.send('Hello World!'));
app.get('/webhook', verifyWebhook);
app.post('/webhook', messageWebhook);

app.listen(8080, () => console.log('Express server is listening on port 8080'));

