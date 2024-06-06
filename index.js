const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(bodyParser.json());
app.use(cors());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const ACCOUNT_ID = process.env.ACCOUNT_ID;
const LOCATION_ID = process.env.LOCATION_ID;
console.log(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI,ACCOUNT_ID,LOCATION_ID);

app.get('/login', (req, res) => {
    const authUri = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=https://www.googleapis.com/auth/business.manage`;
    res.redirect(authUri);
});

app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    try {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI
        });
        const accessToken = tokenResponse.data.access_token;
        res.redirect(`http://localhost:3000/dashboard?access_token=${accessToken}`);
    } catch (error) {
        res.status(500).send('Error getting access token');
    }
});

app.get('/reviews', async (req, res) => {
    const accessToken = req.query.access_token;
    const accountName = `accounts/${ACCOUNT_ID}`;
    const locationName = `locations/${LOCATION_ID}`;
    try {
        const reviewsResponse = await axios.get(`https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/reviews`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        res.json(reviewsResponse.data);
    } catch (error) {
        res.status(500).send('Error fetching reviews');
    }
});

app.post('/publish', async (req, res) => {
    const { accessToken, reviewId, responseText } = req.body;
    const accountName = `accounts/${ACCOUNT_ID}`;
    const locationName = `locations/${LOCATION_ID}`;
    try {
        const publishResponse = await axios.put(`https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/reviews/${reviewId}/reply`, {
            comment: responseText
        }, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        res.json(publishResponse.data);
    } catch (error) {
        res.status(500).send('Error publishing response');
    }
});

app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});
