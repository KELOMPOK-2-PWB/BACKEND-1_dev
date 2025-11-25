const User = require("../models/Users");
const Product = require("../models/Product");
const bcrypt = require("bcryptjs");



// ===========================================================================================
// MANAJEMEN SELLER OLEH ADMIN
// ===========================================================================================


// Ambil semua daftar seller
//  GET /api/admin/sellers
exports.getAllSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: "seller" }).select(
      "-password -otp -resetPasswordToken"
    );
    res.status(200).json(sellers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data seller", error: error.message });
  }
};



// Admin Mengubah Data Seller (Paksa Update)
// PUT /api/admin/seller/updateData/:id
exports.adminUpdateSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    seller.name = req.body.name || seller.name;
    seller.phoneNumber = req.body.phoneNumber || seller.phoneNumber;
    seller.avatar = req.body.avatar || seller.avatar;
    if (req.body.username) seller.username = req.body.username;


    // ======= Gua matiin dulu fitur ini biar admin gak bisa ganti verified account seller dari update yang biasa=======
    // if (req.body.isVerifiedAccount !== undefined) {
    //   seller.isVerifiedAccount = req.body.isVerifiedAccount;
    // } 

  
    if (req.body.sellerInfo) {
      const info = req.body.sellerInfo;

      if (info.store) seller.sellerInfo.store = info.store;

      if (info.socialMedia) {
        if (info.socialMedia.instagram)
          seller.sellerInfo.socialMedia.instagram = info.socialMedia.instagram;
        if (info.socialMedia.facebook)
          seller.sellerInfo.socialMedia.facebook = info.socialMedia.facebook;
      }

      if (info.rating !== undefined) seller.sellerInfo.rating = info.rating;
      if (info.followers !== undefined)
        seller.sellerInfo.followers = info.followers;
    }
    if (req.body.address && Array.isArray(req.body.address)) {
      seller.address = req.body.address;
    }

    await seller.save();

    res.status(200).json({
      message: "Data seller berhasil diperbarui sepenuhnya oleh Admin",
      seller,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal update data seller", error: error.message });
  }
};

// Hapus Seller (Banned)
// DELETE /api/admin/seller/delete/:id
exports.deleteSeller = async (req, res) => {
  try {
    const seller = await User.findByIdAndDelete(req.params.id);
    if (!seller)
      return res.status(404).json({ message: "Seller tidak ditemukan" });

    await Product.deleteMany({ seller: req.params.id });

    res
      .status(200)
      .json({ message: "Seller dan semua produknya telah dihapus." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal menghapus seller", error: error.message });
  }
};



// Verifikasi Akun Seller (Acc/Approve Seller)
// PUT /api/admin/seller/:id/verify
exports.verifySeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);
    if (!seller || seller.role !== "seller") {
      return res.status(404).json({ message: "Seller tidak ditemukan" });
    }
    seller.isVerifiedAccount = !seller.isVerifiedAccount;
    await seller.save();
    res.status(200).json({
      message: `Status verifikasi seller berhasil diubah menjadi: ${seller.isVerifiedAccount}`,
      sellerName: seller.name,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal verifikasi seller", error: error.message });
  }
};




// ===========================================================================================
// MANAJEMEN PRODUK (PENGAWASAN DAN PERUBAHAN) DARI ADMIN
// ===========================================================================================

// Admin mengambil semua produk (dengan opsi filter, paging, dsb)
// GET /api/admin/productsSeller
exports.adminGetAllProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      sellerId,
      isAdvertised,
      isDropItem,
      sort, 
      page = 1, // halaman default 1
      limit = 10, // limit default 10 untuk jumlah barang yang di tampilkan
    } = req.query;
    let query = {};

    // =========== Filter 1 cek dari search/ pencarian nama produk ============
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // =========== Filter 2 cek dari category/ kategori produk ============
    if (category) {
      query.category = category;
    }

    // =========== Filter 3 cek dari sellerId/ produk dari seller tertentu ============
    if (sellerId) {
      query.seller = sellerId;
    }

    // =========== Filter 4 cek dari isAdvertised & isDropItem ============
    if (isAdvertised !== undefined) {
      query.isAdvertised = isAdvertised === "true";
    }

    if (isDropItem !== undefined) {
      query.isDropItem = isDropItem === "true";
    }

    // =========== Filter 5 cek dari sort/ urutan ============
    let sortOptions = { createdAt: -1 }; 
    if (sort) {
      if (sort === "termurah") sortOptions = { price: 1 };
      if (sort === "termahal") sortOptions = { price: -1 };
      if (sort === "palingLama") sortOptions = { createdAt: 1 };
      if (sort === "terlaris") sortOptions = { sold: -1 }; 
      if (sort === "tidakLaris") sortOptions = { sold: 1 };
    }
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("seller", "name username sellerInfo.store isVerifiedAccount")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      message: "Data produk berhasil diambil",
      pagination: {
        totalData: total, // data yang di ambil dari products ada berapa
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum, // ?page=2
        limit: limitNum, // limit dalam 1 page bisa tampil berapa barang
      },
      data: products,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data produk", error: error.message });
  }
};


// Admin Mengubah Produk siapa aja
// PUT /api/admin/productSeller/Update/:id
exports.adminUpdateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    const {
      name,
      description,
      price,
      isAdvertised,
      category,
      isDropItem,
      dropStart,
      dropEnd,
    } = req.body;

    product.name = name || product.name;
    product.description = description || product.description;
    product.category = category || product.category;
    product.price = price || product.price;
    if (isAdvertised !== undefined) product.isAdvertised = isAdvertised;
    product.dropStart = dropStart || product.dropStart;
    product.dropEnd = dropEnd || product.dropEnd;

    const updatedProduct = await product.save();

    res.status(200).json({
      message: "Produk diperbarui oleh Admin",
      product: updatedProduct,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal update produk", error: error.message });
  }
};

//  Admin Menghapus Produk (Takedown)
//  DELETE /productSeller/Delete/:id
exports.adminDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Produk tidak ditemukan" });

    res
      .status(200)
      .json({ message: "Produk berhasil dihapus paksa oleh Admin" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal menghapus produk", error: error.message });
  }
};



