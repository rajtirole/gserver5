require('dotenv').config();
const express = require('express');
const axios = require('axios');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-google-oauth2').Strategy;

const app = express();
// const CLIENT_ID = process.env.CLIENT_ID;
// const CLIENT_SECRET = process.env.CLIENT_SECRET;
// const REDIRECT_URI = process.env.REDIRECT_URI;
// const FRONTEND_REDIRECT_URI = process.env.FRONTEND_REDIRECT_URI;

const CLIENT_ID='1096870135723-c0oma7kg71ednjpqo3of1aqtlnhtj25h.apps.googleusercontent.com'
const CLIENT_SECRET='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'
const REDIRECT_URI='http://localhost:5000/auth/google/callback'
const FRONTEND_REDIRECT_URI='http://localhost:3000/dashboard'

app.use(express.json());
app.use(session({
    secret: '12345678',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new OAuth2Strategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: REDIRECT_URI,
    scope: ["profile", "email", "https://www.googleapis.com/auth/business.manage"]
}, async (accessToken, refreshToken, profile, done) => {
    try {
        profile.accessToken = accessToken;
        return done(null, profile);
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.get('/login', (req, res) => {
    res.redirect('/auth/google');
});


app.get('/auth/google', passport.authenticate('google'));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), async (req, res) => { 
    const accessToken = req.user.accessToken;
    console.log(accessToken);
    try {
        // Fetch account ID
        const accountsResponse = await axios.get('https://mybusiness.googleapis.com/v4/accounts', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const accounts = accountsResponse.data.accounts;
        if (!accounts || accounts.length === 0) {
            return res.status(404).json({ error: 'No accounts found' });
        }

        const accountId = accounts[0].name; // Use the first account for simplicity

        // Fetch location ID
        const locationsResponse = await axios.get(`https://mybusiness.googleapis.com/v4/${accountId}/locations`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const locations = locationsResponse.data.locations;
        if (!locations || locations.length === 0) {
            return res.status(404).json({ error: 'No locations found' });
        }

        const locationId = locations[0].name; // Use the first location for simplicity

        // Fetch reviews
        const reviewsResponse = await axios.get(`https://mybusiness.googleapis.com/v4/${locationId}/reviews`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const reviews = reviewsResponse.data.reviews;

        // Redirect with access token and reviews data
        res.redirect(`${FRONTEND_REDIRECT_URI}?access_token=${accessToken}&reviews=${encodeURIComponent(JSON.stringify(reviews))}`);
    } catch (error) {
        // console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});