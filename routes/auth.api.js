const express = require("express");
const { body } = require("express-validator");

const validators = require("../middlewares/validators");
const authController = require("../controllers/auth.controller");
const router = express.Router();

/**
 * @route POST /auth/login
 * @description log in with email and password
 * @body {email, password}
 * @access Public
 */
router.post("/login", authController.loginWithEmail);

module.exports = router;
