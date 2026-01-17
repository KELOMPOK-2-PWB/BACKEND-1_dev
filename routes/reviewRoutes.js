const express = require('express');
const router = express.Router();

const {
    createReview,
    getProductReviews
} = require('../controllers/reviewController');

const { protect, authorize} = require('../middleware/protectMiddleware');
const authBackend = require('../middleware/authBackend');

router.use(authBackend);
router.post('/:productId', protect, authorize("user"), createReview);
router.get('/:productId', protect, authorize("user"), getProductReviews);

module.exports = router;
