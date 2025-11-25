const User = require("../models/Users");
const Product = require("../models/Product");
const bcrypt = require("bcryptjs");

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

    if (req.body.isVerifiedAccount !== undefined) {
      seller.isVerifiedAccount = req.body.isVerifiedAccount;
    }
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
