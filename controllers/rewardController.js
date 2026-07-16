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
// --- 4. AI ARTICLE GENERATOR WITH AUTOMATIC FALLBACK ---
exports.generateArticleTask = async (req, res) => {
    const { username } = req.body;
    const currentData = db.readDB();
    const titles = currentData.articleTitles || ["Tech Inventions"];
    
    // Pick a random title from database.json
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const prompt = `Write a clean, fascinating, short tech blog post titled "${randomTitle}". Max 3 paragraphs.`;

    let responseText = "";
    let modelUsed = "";

    try {
        // Attempt 1: Try Google's newest default model
        modelUsed = 'gemini-3.5-flash';
        console.log(`[AI Pipeline]: Attempting generation with ${modelUsed}...`);
        
        const response = await ai.models.generateContent({
            model: modelUsed, 
            contents: prompt,
        });
        responseText = response.text;

    } catch (primaryError) {
        console.warn(`[AI Pipeline Warning]: ${modelUsed} failed (likely overloaded). Shifting to fallback...`);
        
        try {
            // Attempt 2: Fall back to Gemini 2.5 Flash (highly stable production model)
            modelUsed = 'gemini-2.5-flash';
            console.log(`[AI Pipeline Fallback]: Attempting generation with ${modelUsed}...`);
            
            const fallbackResponse = await ai.models.generateContent({
                model: modelUsed,
                contents: prompt,
            });
            responseText = fallbackResponse.text;

        } catch (secondaryError) {
            console.warn(`[AI Pipeline Warning]: ${modelUsed} failed. Shifting to ultra-cheap lite fallback...`);
            
            try {
                // Attempt 3: Fall back to Gemini 3.1 Flash-Lite (extremely high rate limit / low traffic)
                modelUsed = 'gemini-3.1-flash-lite';
                const finalResponse = await ai.models.generateContent({
                    model: modelUsed,
                    contents: prompt,
                });
                responseText = finalResponse.text;
                
            } catch (fatalError) {
                console.error("All AI generation pathways exhausted:", fatalError);
                return res.status(500).json({ error: "All AI generation models are currently overloaded. Please try again in a moment." });
            }
        }
    }

    // Wrap the successfully generated text into clean HTML layout
    const articleHTML = `
        <h2 class="text-2xl font-bold text-yellow-400 mb-4">${randomTitle}</h2>
        <p class="text-xs text-gray-500 mb-2 italic">Generated via ${modelUsed}</p>
        <div class="text-gray-300 space-y-4 text-justify">${responseText.replace(/\n/g, '<br>')}</div>
    `;

    // Credit the user balance for reading
    const newBalance = User.addTokens(username, 20);

    res.json({ success: true, article: articleHTML, newBalance });
};