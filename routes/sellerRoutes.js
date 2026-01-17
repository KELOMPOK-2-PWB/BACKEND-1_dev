const express = require('express');
const router = express.Router();
const {
  getSellerProfile,
  updateSellerProfile, changeSellerPassword,
  getSellerAddres,
  addSellerAddress,
  shipOrder,
  getIncomingOrders,
  processOrder,
} = require("../controllers/sellerController");
const { protect, authorize } = require('../middleware/protectMiddleware');
const authBackend = require('../middleware/authBackend');

// Semua route product lewat verifikasi backend + JWT seller
router.use(authBackend);


router.get('/profile', protect, authorize('seller'), getSellerProfile);
router.put("/profile", protect, authorize("seller"), updateSellerProfile);
router.put('/change-password-seller', protect, authorize('seller'), changeSellerPassword);
router.get('/address-seller', protect, authorize('seller'), getSellerAddres);
router.post('/address-seller', protect, authorize('seller'), addSellerAddress);


router.get('/orders', protect, authorize('seller'), getIncomingOrders);
router.put('/orders/:orderId/process', protect, authorize('seller'), processOrder);
router.put('/orders/:orderId/ship', protect, authorize('seller'), shipOrder);

module.exports = router;