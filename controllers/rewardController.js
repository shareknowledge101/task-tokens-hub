const User = require('../models/User');

// Keep track of active ad sessions in-memory
const activeSessions = {};

// --- 1. USER PROFILE ---
exports.getUserProfile = (req, res) => {
    const user = User.findByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ username: req.params.username, tokens: user.tokens });
};

// --- 2. START SECURE AD SESSION ---
exports.startTaskSession = (req, res) => {
    const { username, taskName } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });

    const sessionId = `${username}-${Date.now()}`;
    activeSessions[sessionId] = {
        startTime: Date.now(),
        taskName: taskName
    };

    res.json({ success: true, sessionId });
};

// --- 3. CLAIM AD REWARD ---
exports.claimReward = (req, res) => {
    const { username, amount, sessionId } = req.body;
    
    if (!username || !amount || !sessionId) {
        return res.status(400).json({ error: "Missing verification parameters" });
    }

    const session = activeSessions[sessionId];
    if (!session) {
        return res.status(400).json({ error: "Invalid or expired session. Please try again." });
    }

    const elapsedSeconds = (Date.now() - session.startTime) / 1000;
    
    // Strict 5-second minimum limit to ensure ad impression logs correctly
    if (elapsedSeconds < 4.8) { 
        return res.status(400).json({ error: "Task completed too fast! Please wait for the ad to load." });
    }

    // Remove session so it cannot be reused
    delete activeSessions[sessionId];

    const newBalance = User.addTokens(username, amount);
    console.log(`[Reward Log]: ${username} earned +${amount} tokens via ad interaction.`);
    res.json({ success: true, newBalance });
};