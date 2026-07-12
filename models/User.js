const db = require('../config/db');

class User {
    static findByUsername(username) {
        const data = db.readDB();
        return data.users[username] || null;
    }

    static addTokens(username, amount) {
        const data = db.readDB();
        if (!data.users[username]) {
            data.users[username] = { tokens: 0 };
        }
        data.users[username].tokens += parseInt(amount);
        db.writeDB(data);
        return data.users[username].tokens;
    }
}

module.exports = User;