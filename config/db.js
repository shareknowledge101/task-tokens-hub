const fs = require('fs');
const path = require('path');

// Solve the Vercel ENOENT issue by resolving paths from the root (process.cwd())
const dbPath = path.join(process.cwd(), 'data', 'database.json');

// Memory fallback so the app works seamlessly even if it can't write to disk
let memoryDB = null; 

function readDB() {
    if (memoryDB) return memoryDB;
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        memoryDB = JSON.parse(data);
        return memoryDB;
    } catch (err) {
        console.warn("Could not read database.json, using default schema fallback:", err.message);
        
        // Return a default schema so the application never crashes even if the file is missing
        memoryDB = { 
            users: { "testuser": { "tokens": 120 } }, 
            articleTitles: [
                "The Future of Decentralized Token Economies",
                "Top 5 Automation Hacks for Solo Developers",
                "How Web3 Systems are Reshaping Micro-Tasks",
                "Why Local Storage First Architecture is Winning"
            ] 
        };
        return memoryDB;
    }
}

function writeDB(data) {
    memoryDB = data; // Keep updating user tokens in live memory
    
    // Skip writing to the physical hard drive if running on Vercel (serverless is read-only)
    if (process.env.VERCEL) {
        console.log("On Vercel: Tokens updated in memory, skipped physical file write.");
        return;
    }

    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Failed to write to database:", err);
    }
}

module.exports = { readDB, writeDB };