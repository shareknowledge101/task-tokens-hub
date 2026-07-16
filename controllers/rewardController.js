const User = require('../models/User');
const db = require('../config/db');
const { GoogleGenAI } = require('@google/genai');

// Securely instantiate the AI client with a fallback for Vercel's env setup
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
});

// Keep track of active task sessions in-memory (resets when server restarts)
const activeSessions = {};

// --- 1. USER PROFILE ---
exports.getUserProfile = (req, res) => {
    const user = User.findByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ username: req.params.username, tokens: user.tokens });
};

// --- 2. START SECURE SESSION ---
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

// --- 3. CLAIM REWARD ---
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
    
    // Strict 5-second minimum limit to prevent instant API abuse
    if (elapsedSeconds < 4.8) { 
        return res.status(400).json({ error: "Task completed too fast! Please wait for the ad to load." });
    }

    // Remove session so it cannot be reused
    delete activeSessions[sessionId];

    const newBalance = User.addTokens(username, amount);
    console.log(`[Reward Log]: ${username} earned +${amount} tokens.`);
    res.json({ success: true, newBalance });
};

// --- 4. AI ARTICLE GENERATOR ---
exports.generateArticleTask = async (req, res) => {
    try {
        const { username } = req.body;
        const currentData = db.readDB();
        const titles = currentData.articleTitles || ["Tech Inventions"];
        
        // Pick a random title from database.json
        const randomTitle = titles[Math.floor(Math.random() * titles.length)];

        // Generate full response via free Gemini API
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: `Write a clean, fascinating, short tech blog post titled "${randomTitle}". Max 3 paragraphs.`,
        });

        const articleHTML = `
            <h2 class="text-2xl font-bold text-yellow-400 mb-4">${randomTitle}</h2>
            <div class="text-gray-300 space-y-4 text-justify">${response.text.replace(/\n/g, '<br>')}</div>
        `;

        // Credit the user balance for reading
        const newBalance = User.addTokens(username, 20);

        res.json({ success: true, article: articleHTML, newBalance });
    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: "AI Pipeline structural error." });
    }
};