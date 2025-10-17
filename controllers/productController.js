const Product = require('../models/Product');

//Create prorduk
exports.createProduct = async (req, res) => {
  try {
    const sellerId = req.user._id; // Ambil ID dari JWT
    const { name, description, category, price, quantity, discount, images, isAdvertised } = req.body;

    const product = new Product({
      name,
      description,
      category,
      price,
      quantity,
      discount,
      images,
      isAdvertised,
      seller: sellerId,
    });

    const savedProduct = await product.save();
    res.status(201).json({
      message: 'Produk berhasil dibuat',
      product: savedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Gagal membuat produk',
      error: error.message,
    });
  }
};

//Get produk milik seller yang login
exports.getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const products = await Product.find({ seller: sellerId }).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: 'Gagal mengambil produk',
      error: error.message,
    });
  }
};

//Update produk milik seller yang login
exports.updateProduct = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, seller: sellerId });
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan atau bukan milik Anda' });
    }

    Object.assign(product, req.body);
    const updated = await product.save();

    res.status(200).json({
      message: 'Produk berhasil diperbarui',
      product: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Gagal memperbarui produk',
      error: error.message,
    });
  }
};

//Delete produk milik seller yang login
exports.deleteProduct = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { id } = req.params;

    const deleted = await Product.findOneAndDelete({ _id: id, seller: sellerId });
    if (!deleted) {
      return res.status(404).json({ message: 'Produk tidak ditemukan atau bukan milik Anda' });
    }

    res.status(200).json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    res.status(500).json({
      message: 'Gagal menghapus produk',
      error: error.message,
    });
  }
};
