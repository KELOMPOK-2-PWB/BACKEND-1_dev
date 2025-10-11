// ini nanti aja gua masih mikir cara seller ini biat aman dari users

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/protectMiddleware');

const { updateSellerProfile, verifySellerStatus } = require('../controllers/sellerController');

router.put(
    '/profile',
    protect,
    authorize('seller', 'admin', 'superadmin'),
    updateSellerProfile
);

router.put(
    '/:id/verify-status',
    protect,
    authorize('admin', 'superadmin'),
    verifySellerStatus
);


module.exports = router;