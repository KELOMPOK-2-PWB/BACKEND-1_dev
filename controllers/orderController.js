const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/Users');


// Ambil semua pesanan milik User
//GET /api/orders/myorders
exports.getMyOrders = async (req, res) => {
    try {
        // Cari order dimana field 'user' sama dengan ID user yang login
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 }); // Urutkan dari yang terbaru

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil riwayat pesanan', error: error.message });
    }
};

// Ambil semua pesanan milik User
// GET /api/orders/myorder/:id
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
        }
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Akses ditolak. Ini bukan pesanan Anda.' });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil detail pesanan', error: error.message });
    }
};


// Checkout
// POST /api/orders/checkout
exports.checkout = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (!req.user) {
            throw new Error('User tidak login/ memiliki JWT token.');
        }
        const userId = req.user._id;

        const { addressId } = req.body;

        const user = await User.findById(userId);
        if (!user) throw new Error('User tidak ditemukan');
        let selectedAddress;
        if (addressId) {
            selectedAddress = user.address.id(addressId);
        } else {
            selectedAddress = user.address.find(addr => addr.isDefaultAddress === true);
        }

        if (!selectedAddress) {
            throw new Error('Alamat pengiriman tidak ditemukan. Mohon atur alamat di profil.');
        }

        const shippingAddressSnapshot = {
            street: selectedAddress.street,
            city: selectedAddress.city,
            province: selectedAddress.province,
            postalCode: selectedAddress.postalCode,
            country: selectedAddress.country,
            addressNotes: selectedAddress.addressNotes
        };
        const cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart || cart.items.length === 0) {
            throw new Error('Keranjang kosong');
        }

        let totalAmount = 0;
        const orderItems = [];
        for (const item of cart.items) {

            if (!item.product) {
                throw new Error(`Ada barang di keranjang yang produknya sudah dihapus dari database. Silakan hapus item invalid dari keranjang Anda.`);
            }

            const productId = item.product._id;
            const buyQty = item.quantity;
            const updatedProduct = await Product.findOneAndUpdate(
                {
                    _id: productId,
                    quantity: { $gte: buyQty },
                     isDropActive: true
                },
                {
                    $inc: { quantity: -buyQty, sold: buyQty }
                },
                { session, new: true }
            );

            if (!updatedProduct) {
                throw new Error(`Gagal checkout: Stok barang '${item.product.name}' habis atau tidak tersedia!`);
            }

            totalAmount += updatedProduct.price * buyQty;

            orderItems.push({
                product: productId,
                seller: updatedProduct.seller,
                name: updatedProduct.name,
                price: updatedProduct.price,
                quantity: buyQty,
                image: updatedProduct.images[0]
            });
        }

        const newOrder = new Order({
            user: userId,
            orderItems: orderItems,
            shippingAddress: shippingAddressSnapshot,
            totalPrice: totalAmount,
            status: 'nanti dynamic ini sesuai status',
            paymentMethod: 'ini gak tahu apa :v'
        });

        await newOrder.save({ session });
        // kalau udah masuk ke order di cart di hapus
        cart.items = [];
        await cart.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: 'Checkout berhasil!',
            order: newOrder
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Checkout Error:", error);
        res.status(400).json({ message: 'Transaksi Gagal', error: error.message });
    }
};