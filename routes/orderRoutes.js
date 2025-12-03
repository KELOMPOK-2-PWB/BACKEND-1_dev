const express = require('express');
const router = express.Router();

const { getMyOrders, getOrderById, checkout } = require('../controllers/orderController');

const { protect, authorize } = require('../middleware/protectMiddleware');

router.get('/myorders', protect, authorize('user'), getMyOrders);
router.post('/checkout', protect, authorize('user'), checkout);
router.get('/myorder/:id', protect, authorize('user'), getOrderById);

module.exports = router;