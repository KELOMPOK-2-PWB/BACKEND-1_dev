const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/Users');
const crypto = require("crypto");
const Review = require('../models/Review');

// Helper random unique code user beli
const generateUniqueCode = () => {
  return (
    "TRX-" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100)
  );
};

// GET /api/orders/myOrder
// user get order status
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.product', 'name price images')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Riwayat pesanan Anda',
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil riwayat pesanan', error: error.message });
    }
};





// Checkout dan buat pesanan baru
//POST /api/orders/checkout
exports.checkout = async (req, res) => {
    try {
        const userId = req.user._id;
        const { shippingAddress, shippingCost, selectedProductIds } = req.body;
        if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
            return res.status(400).json({ message: 'Alamat pengiriman tidak lengkap' });
        }
        if (!selectedProductIds || !Array.isArray(selectedProductIds) || selectedProductIds.length === 0) {
            return res.status(400).json({ message: 'Pilih setidaknya satu produk untuk dicheckout' });
        }
        const cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Keranjang kosong' });
        }
        const itemsToCheckout = cart.items.filter(item => {
            return selectedProductIds.includes(item.product._id.toString());
        });

        if (itemsToCheckout.length === 0) {
            return res.status(400).json({ message: 'Produk yang dipilih tidak ditemukan di keranjang Anda' });
        }
        let itemsTotal = 0;
        const orderItems = itemsToCheckout.map(item => {
            itemsTotal += item.product.price * item.quantity;
            return {
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price,
                seller: item.product.seller
            };
        });

        const grandTotal = itemsTotal + (shippingCost || 0);
        const code = generateUniqueCode(); // Pastikan fungsi helper ini ada di file Anda
        const newOrder = await Order.create({
            user: userId,
            items: orderItems,
            shippingAddress: shippingAddress,
            totalAmount: grandTotal,
            uniqueCode: code,
            status: 'pending_payment'
        });
        const remainingItems = cart.items.filter(item => {
            return !selectedProductIds.includes(item.product._id.toString());
        });

        cart.items = remainingItems;
        await cart.save();

        res.status(201).json({
            message: 'Checkout berhasil',
            orderId: newOrder._id,
            uniqueCode: code,
            totalAmount: grandTotal,
            itemCount: orderItems.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal checkout', error: error.message });
    }
};


// Upload bukti pembayaran
// POST /api/orders/:orderId/payment
exports.uploadPaymentProof = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentProofUrl } = req.body; 
    if (!paymentProofUrl) {
      return res
        .status(400)
        .json({ message: "URL bukti pembayaran wajib disertakan | paymentProofUrl" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order tidak ditemukan" });
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Anda tidak berhak mengubah order ini" });
    }

    order.paymentProof = paymentProofUrl;
    order.status = "waiting_verification"; 
    await order.save();

    res.status(200).json({
      message: "Bukti pembayaran diterima. Mohon tunggu verifikasi Admin.",
      status: order.status,
      proofUrl: order.paymentProof,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal update bukti bayar", error: error.message });
  }
};


//  admin cek Validasi
// get /api/orders/verification-list
exports.getOrdersForVerification = async (req, res) => {
    try {
        const orders = await Order.find({ status: 'waiting_verification' })
            .populate('user', 'name email')
            .populate('items.product', 'name price')
            .sort({ updatedAt: 1 });

        res.status(200).json({
            message: 'Daftar pesanan menunggu verifikasi',
            count: orders.length,
            data: orders
        });

    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data verifikasi', error: error.message });
    }
};



// Validasi bukti pembayaran oleh Admin
// POST /api/orders/:orderId/validate
exports.validatePayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { action } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });

        if (action === 'approve') {
            order.status = 'processed';
            order.isPaid = true;
            order.paidAt = Date.now();
            await order.save();
            return res.status(200).json({ message: 'Pembayaran valid. Pesanan diteruskan ke Seller.' });

        } else if (action === 'reject') {
            order.status = 'rejected'; 
            // bentar ini komentarin dulu
            // ini fungsi nya hapus bukti lama biar user upload ulang
            // order.paymentProof = null; 
            await order.save();

            return res.status(200).json({ message: 'Pembayaran ditolak. User di mintaa upload ulang.' });
        } else {
            return res.status(400).json({ message: 'Action tidak valid' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Gagal validasi', error: error.message });
    }
};


// Put  /api/orders/:orderId//complete
// User konfirmasi pesanan sudah Diterima
exports.completeOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order tidak ditemukan' });
        }
        if (order.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Anda tidak memiliki akses ke order ini' });
        }
        if (order.status !== 'sent') {
            return res.status(400).json({
                message: 'Pesanan belum dikirim atau sudah selesai, tidak bisa konfirmasi diterima.'
            });
        }
        order.status = 'completed';
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        await order.save();

        res.status(200).json({
            message: 'Terima kasih! Pesanan telah diselesaikan.',
            status: order.status
        });

    } catch (error) {
        res.status(500).json({ message: 'Gagal menyelesaikan pesanan', error: error.message });
    }
};


// User get history order
// GET /api/orders/historyOrder

exports.getHistoryOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const orders = await Order.find({
            user: userId,
            status: 'completed'
        })
            .populate('items.product', 'name price images') // Ambil info produk
            .sort({ createdAt: -1 })
            .lean();
        const userReviews = await Review.find({ user: userId }).select('product');
        const reviewedProductIds = userReviews.map(r => r.product.toString());
        const historyData = orders.map(order => {
            const itemsWithReviewStatus = order.items.map(item => {
                const isReviewed = item.product ? reviewedProductIds.includes(item.product._id.toString()) : false;

                return {
                    ...item,
                    isReviewed: isReviewed
                };
            });

            return {
                ...order,
                items: itemsWithReviewStatus
            };
        });

        res.status(200).json({
            message: 'Riwayat pembelian selesai',
            count: historyData.length,
            data: historyData
        });

    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil riwayat', error: error.message });
    }
};