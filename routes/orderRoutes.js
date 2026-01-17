const express = require('express');
const router = express.Router();

const { uploadPaymentProof, validatePayment, checkout, getOrdersForVerification } = require('../controllers/orderController');

const { protect, authorize} = require('../middleware/protectMiddleware');

router.post("/checkout", protect, authorize("user"), checkout);

router.post("/:orderId/payment", protect, authorize("user"), uploadPaymentProof);

router.get('/verification-list', protect, authorize("admin"), getOrdersForVerification);
router.put('/:orderId/validate', protect, authorize("admin"), validatePayment);


module.exports = router;