const express = require('express');
const router = express.Router();
// deklarasi routes
const { register, login, verifyOtp, registerSeller } = require('../controllers/authController');
const { updateUserProfile, changePassword, requestEmailUpdate, verifyEmailUpdate } = require('../controllers/userController');
const { protect } = require('../middleware/protectMiddleware');

//router nya
router.post('/register', register); // register users
router.post('/login', login); //login usres
router.post('/verify-otp', verifyOtp); //verify otp users
router.post('/register-seller', registerSeller); //register seller


router.put('/profile', protect, updateUserProfile); //update user profile
router.put('/change-password', protect, changePassword); // update password
router.post('/request-email-update', protect, requestEmailUpdate); // request email update
router.post('/verify-email-update', protect, verifyEmailUpdate); // verify email update


module.exports = router;