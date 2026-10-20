
const db = require("../db/config.js");

// POST /api/families/create
const createFamily = async (req, res, next) => {
    const name =
        typeof req.body.name === 'string'
            ? req.body.name.trim()
            : '';

    if (!name || name.length > 100) {
        return res.status(400).json({
            message: 'A család neve 1–100 karakter lehet.'
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.execute(
            'INSERT INTO families (name, created_by) VALUES (?, ?)',
            [name, req.user.id]
        );

        await connection.execute(
            `INSERT INTO family_members
                (family_id, user_id, role)
             VALUES (?, ?, 'admin')`,
            [result.insertId, req.user.id]
        );

        await connection.commit();

        return res.status(201).json({
            message: 'Család sikeresen létrehozva!',
            family: {
                id: result.insertId,
                name,
                role: 'admin'
            }
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};


//GET /api/families/
const listFamilies = async (req, res, next) => {
    try {
        const [families] = await db.execute(
            `SELECT f.id, f.name, f.created_at, fm.role
             FROM families f
             JOIN family_members fm
                ON fm.family_id = f.id
             WHERE fm.user_id = ?
             ORDER BY f.created_at DESC`,
            [req.user.id]
        );

        res.json({ families });
    } catch (error) {
        next(error);
    }
};

// GET /api/families/:familyId/members
const  listMembers = async (req, res, next) => {
    try {
        const [members] = await db.execute(
            `SELECT u.id, u.username, u.email,
                    fm.role, fm.joined_at
             FROM family_members fm
             JOIN users u ON u.id = fm.user_id
             WHERE fm.family_id = ?
             ORDER BY fm.joined_at ASC`,
            [req.params.familyId]
        );

        res.json({ members });
    } catch (error) {
        console.error(error);
    }
};

// POST /api/families/:familyId/members
const addMember = async (req, res, next) => {
    const familyId = Number(req.params.familyId);

    const email =
        typeof req.body.email === 'string'
            ? req.body.email.trim().toLowerCase()
            : '';

    if (!Number.isInteger(familyId)) {
        return res.status(400).json({
            message: 'Érvénytelen család azonosító.'
        });
    }

    if (!email) {
        return res.status(400).json({
            message: 'Érvényes email cím szükséges.'
        });
    }

    try {
        const [admin] = await db.execute(
            `SELECT 1
             FROM family_members
             WHERE family_id = ? AND user_id = ? AND role = 'admin'
             LIMIT 1`,
            [familyId, req.user.id]
        );

        if (admin.length === 0) {
            return res.status(403).json({
                message: 'Csak a család adminja adhat hozzá tagot.'
            });
        }

        const [users] = await db.execute(
            `SELECT id
             FROM users
             WHERE LOWER(email) = ?
             LIMIT 1`,
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: 'Nem található ilyen email című felhasználó.'
            });
        }

        const newUserId = users[0].id;

        const [existing] = await db.execute(
            `SELECT 1
             FROM family_members
             WHERE family_id = ? AND user_id = ?
             LIMIT 1`,
            [familyId, newUserId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: 'A felhasználó már tagja ennek a családnak.'
            });
        }

        try {
            await db.execute(
                `INSERT INTO family_members (family_id, user_id, role)
                 VALUES (?, ?, 'member')`,
                [familyId, newUserId]
            );
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    message: 'A felhasználó már tagja ennek a családnak.'
                });
            }

            throw error;
        }

        res.status(201).json({
            message: 'A családtag sikeresen hozzáadva.'
        });
    } catch (error) {
        next(error);
    }
};
// DELETE /api/families/:familyId/members/:userId
const removeMember = async (req, res, next) => {
    try {
        const familyId = Number(req.params.familyId);
        const userId = Number(req.params.userId);

        if (!Number.isInteger(familyId) || !Number.isInteger(userId)) {
            return res.status(400).json({ message: 'Érvénytelen azonosító.' });
        }

        const isSelf = userId === req.user.id;

        if (!isSelf) {
            const [admin] = await db.execute(
                `SELECT 1 FROM family_members
                 WHERE family_id = ? AND user_id = ? AND role = 'admin'
                 LIMIT 1`,
                [familyId, req.user.id]
            );

            if (admin.length === 0) {
                return res.status(403).json({
                    message: 'Csak admin távolíthat el tagot.'
                });
            }
        }

        const [result] = await db.execute(
            `DELETE FROM family_members
             WHERE family_id = ? AND user_id = ?`,
            [familyId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'A tag nem található.' });
        }

        res.json({ message: 'Tag eltávolítva.' });
    } catch (error) {
        next(error);
    }
};

module.exports = {createFamily, listFamilies, listMembers, addMember, removeMember};

