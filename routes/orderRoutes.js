const express = require('express');
const router = express.Router();

const { uploadPaymentProof, validatePayment, checkout, getOrdersForVerification, completeOrder, getMyOrders } = require('../controllers/orderController');

const { protect, authorize} = require('../middleware/protectMiddleware');

router.get('/myOrder', protect, authorize("user"), getMyOrders);


router.post("/checkout", protect, authorize("user"), checkout);

router.post("/:orderId/payment", protect, authorize("user"), uploadPaymentProof);

router.get('/verification-list', protect, authorize("admin"), getOrdersForVerification);
router.put('/:orderId/validate', protect, authorize("admin"), validatePayment);

router.put('/:orderId/complete', protect, authorize("user"), completeOrder);
module.exports = router;