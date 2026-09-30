const express = require("express");
const router = express.Router();
const {login, register} = require("../controllers/authController.js");



router.post("/login", login);


module.exports = {router};