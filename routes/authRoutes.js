const express = require('express');
const router = express.Router();
// deklarasi routes
const { register, login, verifyOtp } = require('../controllers/authController');


//router nya
router.post('/register', register); // register users
router.post('/login', login); //login usres
router.post('/verify-otp', verifyOtp); //verify otp users

module.exports = router;