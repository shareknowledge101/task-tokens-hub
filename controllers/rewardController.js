const User = require('../models/User');
const db = require('../config/db');
const { GoogleGenAI } = require('@google/genai');

// Securely instantiate the AI client (Set your GEMINI_API_KEY environment variable)
const ai = new GoogleGenAI({});

exports.getUserProfile = (req, res) => {
    const user = User.findByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ username: req.params.username, tokens: user.tokens });
};

exports.claimReward = (req, res) => {
    const { username, amount, taskName } = req.body;
    if (!username || !amount) return res.status(400).json({ error: "Missing parameters" });

    const newBalance = User.addTokens(username, amount);
    res.json({ success: true, newBalance });
};

// --- NEW METHOD: AI ARTICLE GENERATOR ---
exports.generateArticleTask = async (req, res) => {
    try {
        const { username } = req.body;
        const currentData = db.readDB();
        const titles = currentData.articleTitles || ["Tech Inventions"];
        
        // Pick a random title from database.json
        const randomTitle = titles[Math.floor(Math.random() * titles.length)];

        // Generate full response via free Gemini API
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash',
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