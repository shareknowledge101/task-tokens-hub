const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../data/database.json');

function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: { "testuser": { tokens: 120 } } }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = { readDB, writeDB };