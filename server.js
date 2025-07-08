// server.js
require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const session = require('express-session');

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// 1. Redirect user to Google for authentication
app.get('/auth/google', (req, res) => {
    const scopes = ['https://www.googleapis.com/auth/analytics.readonly'];
    const url = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes });
    res.redirect(url);
});

// 2. Google redirects back to this URL after authentication
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        req.session.tokens = tokens; // Store tokens in session
        res.redirect('http://localhost:3000/dashboard'); // Redirect to frontend dashboard
    } catch (error) {
        console.error('Error getting tokens:', error);
        res.status(500).send('Authentication failed');
    }
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.tokens) {
        oauth2Client.setCredentials(req.session.tokens);
        return next();
    }
    res.status(401).send('Unauthorized');
};

// 3. API endpoint to get Audience Overview data
app.get('/api/data/overview', isAuthenticated, async (req, res) => {
    const { startDate = '28daysAgo', endDate = 'today' } = req.query;
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

    try {
        const response = await analyticsData.properties.runReport({
            property: `properties/${process.env.GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'date' }],
            metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'newUsers' }],
            orderBys: [{ dimension: { orderType: 'ALPHANUMERIC', dimensionName: 'date' } }]
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching GA data:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. API endpoint to get Traffic Source data
app.get('/api/data/traffic', isAuthenticated, async (req, res) => {
    const { startDate = '28daysAgo', endDate = 'today' } = req.query;
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });
    
    try {
        const response = await analyticsData.properties.runReport({
            property: `properties/${process.env.GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'sessionDefaultChannelGroup' }],
            metrics: [{ name: 'sessions' }],
            orderBys: [{ metric: { orderType: 'NUMERIC', metricName: 'sessions' }, desc: true }]
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching GA Traffic data:', error);
        res.status(500).json({ error: error.message });
    }
});


app.listen(5000, () => console.log('Server running on http://localhost:5000'));
