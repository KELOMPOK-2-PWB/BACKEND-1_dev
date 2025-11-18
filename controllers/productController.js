const Product = require('../models/Product');

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


//Create prorduk
// /api/products
exports.createProduct = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const {
      name, description, category, price, quantity, discount, images,
      isAdvertised, isDropItem, dropStart, dropEnd
    } = req.body;

    const product = new Product({
      name,
      description,
      category,
      price,
      quantity,
      discount,
      images,
      isAdvertised,
      isDropItem,
      dropStart,
      dropEnd,
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


//Update produk milik seller yang login

exports.updateProduct = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, seller: sellerId });
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan atau bukan milik Anda' });
    }
    const {
      name, description, category, price, quantity, discount, images,
      isAdvertised, isDropItem, dropStart, dropEnd
    } = req.body;
    product.name = name || product.name;
    product.description = description || product.description;
    product.category = category || product.category;
    product.price = price || product.price;
    product.quantity = quantity || product.quantity;
    product.discount = discount || product.discount;
    product.images = images || product.images;
    product.isAdvertised = isAdvertised || product.isAdvertised;

    if (isDropItem !== undefined) {
      product.isDropItem = isDropItem;
    }
    product.dropStart = dropStart || product.dropStart;
    product.dropEnd = dropEnd || product.dropEnd;
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
