const User = require('../models/Users');
const bcrypt = require("bcryptjs");



//Get profile Users
// Get /api/sellers/profile

exports.getSellerProfile = async (req, res) => {
    const seller = req.user;

    if (seller) {
        res.status(200).json({
            _id: seller._id,
            name: seller.name,
            username: seller.username,
            email: seller.email,
            phoneNumber: seller.phoneNumber,
            avatar: seller.avatar,
            role: seller.role,

            isVerifiedAccount: seller.isVerifiedAccount,
            sellerInfo: seller.sellerInfo,

            addresses: seller.addresses,
            createdAt: seller.createdAt
        });
    } else {
        res.status(404).json({ message: 'Data seller tidak ditemukan' });
    }
};





//Update profil seller
// Cuma bisa diubah sama seller (atau admin/superadmin)
// Put /api/sellers/profile
exports.updateSellerProfile = async (req, res) => {
  try {
    const seller = await User.findById(req.user.id);

    if (!seller) {
      return res.status(404).json({ message: "Seller tidak ditemukan." });
    }
    const { name, phoneNumber, avatar, store, socialMedia } = req.body;
    seller.name = name || seller.name;
    seller.username = name || seller.username;
    seller.phoneNumber = phoneNumber || seller.phoneNumber;
    seller.avatar = avatar || seller.avatar;
    if (store) {
      seller.sellerInfo.store = store;
    }
    if (socialMedia) {
      if (socialMedia.instagram) {
        seller.sellerInfo.socialMedia.instagram = socialMedia.instagram;
      }
      if (socialMedia.facebook) {
        seller.sellerInfo.socialMedia.facebook = socialMedia.facebook;
      }
    }
    await seller.save();
    res.status(200).json({
      message: "Profil seller berhasil diperbarui.",
      profile: {
        _id: seller._id,
        name: seller.name,
        username: seller.username,
        email: seller.email,
        phoneNumber: seller.phoneNumber,
        avatar: seller.avatar,
        role: seller.role,
        isVerifiedAccount: seller.isVerifiedAccount,
        sellerInfo: seller.sellerInfo,
        addresses: seller.addresses,
        createdAt: seller.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal memperbarui profil seller.",
      error: error.message,
    });
  }
};

// Ubah password seller
// Put /api/sellers/change-password

exports.changeSellerPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Password saat ini dan password baru wajib diisi" });
  }
  try {
    const seller = await User.findById(req.user.id).select("+password");
    const isMatch = await bcrypt.compare(currentPassword, seller.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password saat ini salah" });
    }
    seller.password = newPassword;

    await seller.save();

    res.status(200).json({ message: "Password Toko kamu berhasil diubah" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};

// Verif status sellernya
// Terus cuma bisa dilakuin admin atau superadmin
exports.verifySellerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const seller = await User.findById(id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller tidak ditemukan.' });
    }

    if (seller.role !== 'seller') {
      return res.status(400).json({ message: 'User ini bukan seller.' });
    }

    seller.isVerified = isVerified;
    await seller.save();

    res.status(200).json({
      message: `Status verifikasi seller berhasil diperbarui menjadi ${isVerified ? 'Terverifikasi' : 'Belum diverifikasi'}.`,
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        role: seller.role,
        isVerified: seller.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Gagal memperbarui status verifikasi seller.',
      error: error.message,
    });
  }
};
