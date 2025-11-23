// File: routes/cartRoutes.js

const express = require('express');
const router = express.Router();
const { addToCart, getCart, updateCartItem, removeCartItem } = require('../controllers/cartController');
const { protect, authorize} = require('../middleware/protectMiddleware');

router.use(protect);

router.get('/',  protect,  authorize('user'), getCart);
router.post('/addCart',  protect,  authorize('user'), addToCart);
router.put('/update',  protect,  authorize('user'), updateCartItem);
router.delete('/remove/:productId',  protect,  authorize('user'), removeCartItem);

module.exports = router;