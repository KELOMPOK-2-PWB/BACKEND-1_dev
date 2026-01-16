const express = require('express');
const router = express.Router();

const {
    createReview,
    getProductReviews
} = require('../controllers/reviewController');

const { protect } = require('../middleware/protectMiddleware');
const authBackend = require('../middleware/authBackend');

// semua lewat backend auth
router.use(authBackend);

// user login
router.post('/:productId', protect, createReview);

// public
router.get('/:productId', getProductReviews);

module.exports = router;
