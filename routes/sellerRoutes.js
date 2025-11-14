const express = require('express');
const router = express.Router();
const {
  getSellerProfile,
  updateSellerProfile, changeSellerPassword,
} = require("../controllers/sellerController");
const { protect, authorize } = require('../middleware/protectMiddleware');
const authBackend = require('../middleware/authBackend');

// Semua route product lewat verifikasi backend + JWT seller
router.use(authBackend);


router.get('/profile', protect, authorize('seller'), getSellerProfile);
router.put("/profile", protect, authorize("seller"), updateSellerProfile);
router.put('/change-password-seller', protect, authorize('seller'), changeSellerPassword);

module.exports = router;