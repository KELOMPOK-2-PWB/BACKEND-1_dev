const express = require('express');
const router = express.Router();
const {
    getAvailableProducts,
    getAvailableProductsCustom,
    searchStores
} = require('../controllers/productController_2');

const { protect, authorize } = require('../middleware/protectMiddleware');
const authBackend = require('../middleware/authBackend');

// Semua route product lewat verifikasi backend + JWT seller
router.use(authBackend);

router.get('/', protect,  authorize('user'), getAvailableProducts);
router.get('/search', protect,  authorize('user'), getAvailableProductsCustom);
router.get('/search-store', protect,  authorize('user'), searchStores);

module.exports = router;