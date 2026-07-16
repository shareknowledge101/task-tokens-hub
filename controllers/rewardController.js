const crypto = require('crypto');
const User = require('../models/User');

// A secure key to sign our sessions (Vercel-safe fallback)
const SECRET_KEY = process.env.SESSION_SECRET || 'super-secure-token-hub-key-1337';

// --- 1. USER PROFILE ---
exports.getUserProfile = (req, res) => {
    const user = User.findByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ username: req.params.username, tokens: user.tokens });
};

// --- 2. START SECURE AD SESSION (Stateless) ---
exports.startTaskSession = (req, res) => {
    const { username, taskName } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });

    // Pack the session data into a payload
    const sessionPayload = {
        username: username,
        taskName: taskName,
        startTime: Date.now()
    };

    // Serialize and cryptographically sign the payload
    const payloadStr = JSON.stringify(sessionPayload);
    const signature = crypto.createHmac('sha256', SECRET_KEY).update(payloadStr).digest('hex');
    
    // Combine base64 payload and signature to make a secure token
    const base64Payload = Buffer.from(payloadStr).toString('base64');
    const sessionId = `${base64Payload}.${signature}`;

    res.json({ success: true, sessionId });
};

// --- 3. CLAIM AD REWARD (Stateless Verification) ---
exports.claimReward = (req, res) => {
    const { username, amount, sessionId } = req.body;
    
    if (!username || !amount || !sessionId) {
        return res.status(400).json({ error: "Missing verification parameters" });
    }

    try {
        // Split the token into its payload and signature components
        const parts = sessionId.split('.');
        if (parts.length !== 2) {
            return res.status(400).json({ error: "Malformed session format." });
        }

        const [base64Payload, signature] = parts;
        const payloadStr = Buffer.from(base64Payload, 'base64').toString('utf8');

        // Re-calculate signature to verify data has not been tampered with
        const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(payloadStr).digest('hex');
        if (signature !== expectedSignature) {
            return res.status(400).json({ error: "Session validation failed (Invalid signature)." });
        }

        // Parse verified session data
        const session = JSON.parse(payloadStr);

        // Security Check: Verify username matches the session owner
        if (session.username !== username) {
            return res.status(400).json({ error: "Identity mismatch detected." });
        }

        // Security Check: Enforce minimum watch duration (4.8 seconds)
        const elapsedSeconds = (Date.now() - session.startTime) / 1000;
        if (elapsedSeconds < 4.8) { 
            return res.status(400).json({ error: "Task completed too fast! Please watch the ad." });
        }

        // Since the signature is cryptographically verified, we can trust the elapsed time!
        const newBalance = User.addTokens(username, amount);
        console.log(`[Reward Log]: ${username} earned +${amount} tokens via ad interaction.`);
        
        res.json({ success: true, newBalance });

    } catch (err) {
        console.error("Session processing error:", err);
        return res.status(400).json({ error: "Failed to process security session." });
    }
};