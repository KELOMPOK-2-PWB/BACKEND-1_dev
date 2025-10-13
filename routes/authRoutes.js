const express = require('express');
const router = express.Router();
// deklarasi routes
const { register, login, verifyOtp, registerSeller, forgotPassword, verifyResetOtp, resetPassword } = require('../controllers/authController');


//router nya
router.post('/register', register); // register users
router.post('/login', login); //login usres
router.post('/verify-otp', verifyOtp); //verify otp users
router.post('/register-seller', registerSeller); //register seller
router.post('/forgot-password', forgotPassword); //forgot password
router.post('/verify-reset-otp-password', verifyResetOtp); //verify reset otp
router.post('/reset-password', resetPassword); //reset password



module.exports = router;