const express = require('express');
const router = express.Router();
const {
    getAvailableProducts,
    getAvailableProductsCustom
} = require('../controllers/productController_2');

const { protect, authorize } = require('../middleware/protectMiddleware');
const authBackend = require('../middleware/authBackend');

// Semua route product lewat verifikasi backend + JWT seller
router.use(authBackend);

router.get('/', protect, getAvailableProducts);
router.get('/search', protect, getAvailableProductsCustom);

module.exports = router;