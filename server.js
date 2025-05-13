const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const https = require('https');
const winston = require('winston');

const app = express();
const PORT = 3000;

const SPLUNK_HEC_URL = 'https://localhost:8088/services/collector';
const SPLUNK_HEC_TOKEN = '36c68caf-89a0-4c0e-a5ea-1b429795e3e0';

app.use(bodyParser.urlencoded({ extended: true }));

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'login.log' }),
  ],
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const timestamp = new Date().toISOString();

  const logMessage = `${timestamp} - Login attempt by user: ${username}`;
  logger.info(logMessage);

  try {
    await axios.post(SPLUNK_HEC_URL, {
      event: {
        type: 'login_attempt',
        username,
        status: 'received',
        timestamp,
      },
      sourcetype: 'login_logs', // Change sourcetype here
      index: 'jenkinsgit_logs',  // Change index here
    }, {
      headers: {
        'Authorization': `Splunk ${SPLUNK_HEC_TOKEN}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    console.log('✅ Successfully logged to Splunk');
  } catch (err) {
    console.error('❌ Error logging to Splunk:', err.message);
    if (err.response) {
      console.error('🔎 Splunk Response:', err.response.data);
    }
  }

  res.send(`Login received for user: ${username}`);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});