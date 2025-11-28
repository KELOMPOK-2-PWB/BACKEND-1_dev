const User = require("../models/Users");
const Product = require("../models/Product");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");




// ===========================================================================================
// MANAJEMEN SELLER OLEH ADMIN
// ===========================================================================================


// Ambil semua daftar seller
//  GET /api/admin/sellers
exports.getAllSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: "seller" }).select(
      "+password +isBanned -otp -resetPasswordToken"
    );
    res.status(200).json(sellers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data seller", error: error.message });
  }
};

// Ambil detail satu Seller berdasarkan ID
// GET /api/admin/seller/:id
exports.getSellerById = async (req, res) => {
  const SellerId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(SellerId)) {
    return res.status(400).json({
      message: "Format ID Seller tidak valid. Pastikan ID benar.",
    });
  }
  try {
    const seller = await User.findOne({ _id: SellerId, role: "seller" }).select('-password +isBanned -otp');

    if (!seller) {
      return res.status(404).json({ message: 'Seller tidak ditemukan' });
    }
    res.status(200).json(seller);
  } catch (error) {

    res.status(500).json({ message: 'Gagal mengambil detail user', error: error.message });
  }
};


// Ambil detail satu Seller berdasarkan Name
// GET /api/admin/seller/search/name?q=
exports.searchSellersByName = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Mohon masukkan kata kunci pencarian (?q=...)' });
    }
    const users = await User.find({
      role: 'seller',
      name: { $regex: q, $options: 'i' }
    })
        .select('-password -otp -resetPasswordToken +isBanned');
    res.status(200).json({
      count: users.length,
      users
    });

  } catch (error) {
    res.status(500).json({ message: 'Gagal mencari seller', error: error.message });
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

// Hapus Data Seller
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



// ===========================================================================================
// MANAJEMEN USER (PENGAWASAN DAN PERUBAHAN) DARI ADMIN
// ===========================================================================================

// Ambil semua data User (Pembeli)
// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select(
      "+password +isBanned -otp -resetPasswordToken"
    );
    res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data user", error: error.message });
  }
};

// Ambil detail satu User berdasarkan ID
// GET /api/admin/user/:id
exports.getUserById = async (req, res) => {
  const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Format ID User tidak valid. Pastikan ID benar.",
      });
    }
    try {
        const user = await User.findById(req.params.id).select('-password +isBanned -otp');

        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        res.status(200).json(user);
    } catch (error) {
      
        res.status(500).json({ message: 'Gagal mengambil detail user', error: error.message });
    }
};


// Ambil detail satu User berdasarkan Name
// GET /api/admin/user/search/name?q=
exports.searchUsersByName = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Mohon masukkan kata kunci pencarian (?q=...)' });
    }
    const users = await User.find({
      role: 'user',
      name: { $regex: q, $options: 'i' }
    })
        .select('-password -otp -resetPasswordToken +isBanned');
    res.status(200).json({
      count: users.length,
      users
    });

  } catch (error) {
    res.status(500).json({ message: 'Gagal mencari user', error: error.message });
  }
};



// Admin Update Data User (Bisa ganti apa saja termasuk password)
// PUT /api/admin/user/updateData/:id
exports.adminUpdateUser = async (req, res) => {
  const userId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      message: "Format ID User tidak valid. Pastikan ID benar.",
    });
  }
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        user.name = req.body.name || user.name;
        user.username = req.body.username || user.username;
        // user.email = req.body.email || user.email;
        user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
        user.avatar = req.body.avatar || user.avatar;

        if (req.body.address && Array.isArray(req.body.address)) {
          user.address = req.body.address;
        }

        await user.save();

        res.status(200).json({
            message: 'Data user berhasil diperbarui oleh Admin',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                address: user.address
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username atau Email sudah digunakan user lain.' });
        }
        res.status(500).json({ message: 'Gagal update user', error: error.message });
    }
};

// Hapus Seller dan user permanenen secara bersama
// DELETE /api/admin/user/delete/:id
exports.deleteUser = async (req, res) => {
  const userId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      message: "Format ID User tidak valid. Pastikan ID benar.",
    });
  }
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        res.status(200).json({ message: 'User berhasil dihapus permanen' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus user', error: error.message });
    }
};


// ==================== UNTUK BANNED ADMIN USER DAN SELLER DI JADIKAN SATU ===================
// Ban atau Unban User/user
// PUT /api/admin/userseller/banned/:id?banned=
exports.adminBannedUserSeller = async (req, res) => {
  const userId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      message: "Format ID User/ Seller tidak valid. Pastikan ID benar.",
    });
  }
  try {
    const user = await User.findById(req.params.id).select('+isBanned');

    if (!user) {
      return res.status(404).json({ message: 'user/ Seller tidak ditemukan' });
    }

    if (user.role === 'admin' || user.role === 'superadmin') {
      return res.status(400).json({ message: 'Tidak dapat memblokir sesama Admin.' });
    }
    const { banned } = req.query;

    if (banned !== undefined) {
      user.isBanned = banned === 'true';
    } else {
      user.isBanned = !user.isBanned;
    }

    await user.save();

    const statusText = user.isBanned ? 'DIBLOKIR' : 'DIPULIHKAN';

    res.status(200).json({
      message: `Akses User/ Seller ${user.name} berhasil ${statusText}.`,
      isBanned: user.isBanned
    });

  } catch (error) {
    res.status(500).json({ message: 'Gagal mengubah status banned', error: error.message });
  }
};


