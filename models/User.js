const db = require('../db/config.js');

const User = {

    async findByEmail(email) {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        return rows[0];
    },

    async create(username, email, password) {
        const [result] = await db.execute(
            `INSERT INTO users (username, email, password)
             VALUES (?, ?, ?)`,
            [username, email, password]
        );

        return result.insertId;
    }

};

module.exports = User;