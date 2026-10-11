const express = require("express");
const router = express.Router();
const {login, register, profile} = require("../controllers/authController.js");
const authMiddleware = require("../middleware/authMiddleware.js");


router.post("/login", login);
router.post("/register", register);
router.get("/me", authMiddleware, profile);




module.exports = router;