const User = require('../models/User.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'Minden mező kitöltése kötelező!'
            });
        }

        const existingUser = await User.findByEmail(email);

        if (existingUser) {
            return res.status(409).json({
                message: 'Ez az email cím már használatban van!'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const userId = await User.create(
            username,
            email,
            hashedPassword
        );

        res.status(201).json({
            message: 'Sikeres regisztráció!',
            userId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Hiba történt a regisztráció során!'
        });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email és jelszó megadása kötelező!'
            });
        }

        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(401).json({
                message: 'Hibás email vagy jelszó!'
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Hibás email vagy jelszó!'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        res.status(200).json({
            message: 'Sikeres bejelentkezés!',
            token
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Hiba történt a bejelentkezés során!'
        });
    }
};



const profile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'A felhasználó nem található.'
            });
        }

        return res.status(200).json({
            user
        });
    } catch (error) {
        console.error('Profillekérési hiba:', error.message);

        return res.status(500).json({
            message: 'Szerverhiba történt.'
        });
    }
};



module.exports = {login, register, profile};