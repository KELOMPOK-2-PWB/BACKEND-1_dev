// File: controllers/cartController.js

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');


// Lihat isi keranjang
// GET /api/cart
exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'name price images seller isDropActive dropStatus');
        if (!cart) {
            return res.status(200).json({ items: [] });
        }

        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil keranjang', error: error.message });
    }
};



// Tambah barang ke keranjang
// POST /api/cart
exports.addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    if (quantity < 1) {
        return res.status(400).json({message: 'Quantity Proudk yang di Beli User tidak boleh kurang dari 1'})
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
            message: 'Format ID Produk tidak valid (ID harus berupa 24 karakter hex string).'
        });
    }

    if (!productId || !quantity) {
        return res.status(400).json({ message: 'Product ID dan Quantity wajib diisi' });
    }

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }
        if (product.quantity < quantity) {
            return res.status(400).json({ message: `Stok tidak cukup. Sisa: ${product.quantity}` });
        }

        if (!product.isDropActive) {
            return res.status(400).json({ message: 'Produk ini sedang tidak tersedia (Belum mulai atau sudah habis).' });
        }
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({
                user: userId,
                items: []
            });
        }
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            const newQuantity = cart.items[itemIndex].quantity + quantity;
            if (newQuantity > product.quantity) {
                return res.status(400).json({ message: 'Total jumlah di keranjang melebihi stok tersedia.' });
            }
            cart.items[itemIndex].quantity = newQuantity;
        } else {
            cart.items.push({ product: productId, quantity: quantity });
        }

        await cart.save();
        res.status(200).json({ message: 'Berhasil masuk keranjang', cart });

    } catch (error) {
        res.status(500).json({ message: 'Gagal menambahkan ke keranjang', error: error.message });
    }
};


// Update jumlah item di keranjang
// PUT /api/cart/update
exports.updateCartItem = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user._id;
    if (!productId || quantity === undefined) {
        return res.status(400).json({ message: 'Product ID dan Quantity wajib diisi' });
    }

    if (quantity < 1) {
        return res.status(400).json({ message: 'Quantity minimal 1. Gunakan fitur hapus jika ingin menghapus.' });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Format ID Produk tidak valid.' });
    }

    try {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Keranjang tidak ditemukan' });
        }
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Barang tidak ditemukan di keranjang' });
        }
        const product = await Product.findById(productId);

        if (!product) {
            cart.items.splice(itemIndex, 1);
            await cart.save();
            return res.status(404).json({ message: 'Produk tidak lagi tersedia (dihapus dari database).' });
        }
        if (!product.isDropActive) {
            return res.status(400).json({ message: 'Waktu pembelian produk ini sudah habis atau belum dimulai.' });
        }
        if (quantity > product.quantity) {
            return res.status(400).json({ message: `Stok tidak cukup untuk jumlah yang diminta. Sisa: ${product.quantity}` });
        }
        cart.items[itemIndex].quantity = quantity;

        await cart.save();
        const updatedCart = await Cart.findOne({ user: userId }).populate('items.product', 'name price images seller isDropActive dropStatus');

        res.status(200).json({ message: 'Jumlah barang diperbarui', cart: updatedCart });

    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui keranjang', error: error.message });
    }
};

// Hapus satu item dari keranjang
//DELETE /api/cart/remove/:productId
exports.removeCartItem = async (req, res) => {
    const { productId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Format ID Produk tidak valid.' });
    }

    try {
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ message: 'Keranjang kosong' });
        }
        const itemExists = cart.items.some(item => item.product.toString() === productId);
        if (!itemExists) {
            return res.status(404).json({ message: 'Barang tidak ada di keranjang' });
        }
        cart.items = cart.items.filter(item => item.product.toString() !== productId);

        await cart.save();
        const updatedCart = await Cart.findOne({ user: userId }).populate('items.product', 'name price images seller isDropActive dropStatus');

        res.status(200).json({ message: 'Barang dihapus dari keranjang', cart: updatedCart });

    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus barang', error: error.message });
    }
};