const db = require('../db/config.js');

const Family = {
    async create(name, userId) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [familyResult] = await connection.execute(
                `INSERT INTO families (name, created_by)
                 VALUES (?, ?)`,
                [name, userId]
            );

            const familyId = familyResult.insertId;

            await connection.execute(
                `INSERT INTO family_members (family_id, user_id, role)
                 VALUES (?, ?, 'admin')`,
                [familyId, userId]
            );

            await connection.commit();

            return familyId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    async findByUserId(userId) {
        const [rows] = await db.execute(
            `SELECT f.id, f.name, f.created_by, f.created_at, fm.role
             FROM families f
             INNER JOIN family_members fm ON fm.family_id = f.id
             WHERE fm.user_id = ?
             ORDER BY f.created_at DESC`,
            [userId]
        );

        return rows;
    },

    async findById(familyId) {
        const [rows] = await db.execute(
            `SELECT id, name, created_by, created_at
             FROM families
             WHERE id = ?`,
            [familyId]
        );

        return rows[0];
    },

    async findMemberRole(familyId, userId) {
        const [rows] = await db.execute(
            `SELECT role
             FROM family_members
             WHERE family_id = ? AND user_id = ?`,
            [familyId, userId]
        );

        return rows[0];
    },

    async findMembers(familyId) {
        const [rows] = await db.execute(
            `SELECT fm.user_id, u.username, u.email,
                    fm.role, fm.joined_at
             FROM family_members fm
             INNER JOIN users u ON u.id = fm.user_id
             WHERE fm.family_id = ?
             ORDER BY fm.joined_at ASC`,
            [familyId]
        );

        return rows;
    },

    async findUserByEmail(email) {
        const [rows] = await db.execute(
            `SELECT id, username, email
             FROM users
             WHERE LOWER(email) = LOWER(?)`,
            [email]
        );

        return rows[0];
    },

    async addMember(familyId, userId) {
        const [result] = await db.execute(
            `INSERT INTO family_members (family_id, user_id, role)
             VALUES (?, ?, 'member')`,
            [familyId, userId]
        );

        return result.insertId;
    },

    async removeMember(familyId, userId) {
        const [result] = await db.execute(
            `DELETE FROM family_members
             WHERE family_id = ? AND user_id = ? AND role = 'member'`,
            [familyId, userId]
        );

        return result.affectedRows > 0;
    }
};

module.exports = Family;