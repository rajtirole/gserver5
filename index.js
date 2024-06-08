// backend.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Use cors middleware
app.use(cors({
    origin: 'https://gclient2.onrender.com', // Update this to your frontend URL
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization'
}));

app.use(bodyParser.json());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://gserver5.onrender.com/auth/google/callback'; // Your backend callback URL
const FRONTEND_REDIRECT_URI = 'https://gclient2.onrender.com'; // Your frontend URL

app.get('/login', (req, res) => {
    const authUri = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/business.manage`;
    res.redirect(authUri);
});

app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    console.log(code);
    try {
        // Exchange authorization code for access token
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI
        });
        const accessToken = tokenResponse.data.access_token;
        console.log(accessToken);

        // Fetch user data
        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const userData = userResponse.data;
        console.log(userData);

        // Fetch account and location ID
        const accountsResponse = await axios.get('https://mybusiness.googleapis.com/v4/accounts', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const accountId = accountsResponse.data.accounts[0].name; // Assuming the first account
        console.log(accountId);
        const locationsResponse = await axios.get(`https://mybusiness.googleapis.com/v4/${accountId}/locations`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const locationId = locationsResponse.data.locations[0].name; // Assuming the first location
        console.log(locationId);

        // Fetch reviews
        const reviewsResponse = await axios.get(`https://mybusiness.googleapis.com/v4/${locationId}/reviews`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const reviews = reviewsResponse.data.reviews;
        console.log(reviews);
        // Redirect to frontend with user data and reviews
        res.redirect(`${FRONTEND_REDIRECT_URI}/reviews?access_token=${accessToken}&user=${encodeURIComponent(JSON.stringify(userData))}&reviews=${encodeURIComponent(JSON.stringify(reviews))}`);
    } catch (error) {
        console.error('Error during OAuth callback:', error);
        res.status(500).send('Error during OAuth callback');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
