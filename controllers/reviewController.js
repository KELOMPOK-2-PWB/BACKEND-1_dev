const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// ==========================
// GET REVIEW PRODUK (PUBLIC)
// GET /api/reviews/:productId
// ==========================
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Format ID Produk tidak valid' });
        }

        const reviews = await Review.find({ product: productId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Daftar review produk',
            count: reviews.length,
            data: reviews
        });

    } catch (error) {
        res.status(500).json({
            message: 'Gagal mengambil review',
            error: error.message
        });
    }
};


// ==========================
// CREATE REVIEW (USER)
// POST /api/reviews/:productId
// ==========================
exports.createReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;
        const { rating, comment } = req.body;

       if (!rating || !comment) {
            return res.status(400).json({ message: 'rating dan comment wajib diisi' });
        }

        // 1️⃣ cek apakah user pernah beli produk ini
        const order = await Order.findOne({
            user: userId,
            "items.product": productId,
            status: 'completed'
        });

        if (!order) {
            return res.status(403).json({
                message: 'Anda tidak dapat mereview produk ini. FE cek sttatus user wajib (Status: Completed) pembelian nya.'
            });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating harus antara 1 - 5' });
        }

        // 2️⃣ cek apakah sudah pernah review
        const existingReview = await Review.findOne({
            user: userId,
            product: productId
        });
        if (existingReview) {
            return res.status(400).json({
                message: 'Anda sudah memberikan review untuk produk ini'
            });
        }

        // 3️⃣ simpan review
        const review = await Review.create({
            user: userId,
            product: productId,
            order: order._id,
            rating: Number(rating),
            comment: comment
        });

        await review.save();

        // 4️⃣ update rating product
        const reviews = await Review.find({ product: productId });
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);

        await Product.findByIdAndUpdate(productId, {
            rating: {
                average: totalRating / reviews.length,
                count: reviews.length
            }
        });

        res.status(201).json({
            message: 'Review berhasil ditambahkan',
            review
        });

    } catch (error) {
        res.status(500).json({
            message: 'Gagal menambahkan review',
            error: error.message
        });
    }
};

