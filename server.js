const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const postbackController = require('./controllers/postbackController');
const app = express();
const PORT = process.env.PORT || 3000;

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static UI Files
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Endpoints
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);

// The asterisk (*) prefix defines a wildcard named "splat"
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Hub Architecture running cleanly at http://localhost:${PORT}`);
});

// Route for frontend to fetch the tracked ad link
app.post('/api/get-ad-link', postbackController.generateAdLink);

// Route for Adsterra to call when a conversion is approved
app.get('/api/adsterra-postback', postbackController.handleAdsterraPostback);