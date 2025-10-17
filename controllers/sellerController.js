const User = require('../models/Users');
const sellerRoutes = require('./routes/sellerRoutes');
app.use('/api/sellers', sellerRoutes);


//Update profil seller
// Cuma bisa diubah sama seller (atau admin/superadmin)
exports.updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const { store, socialMedia, rating, followers } = req.body;

    // ambil data si user berdasarkan ID dan role
    const seller = await User.findOne({ _id: sellerId, role: 'seller' });
    if (!seller) {
      return res.status(404).json({ message: 'Seller tidak ditemukan atau bukan seller.' });
    }

    // update cuma field yang boleh diupdate
    if (store) seller.sellerInfo.store = store;
    if (socialMedia) {
      if (socialMedia.instagram) seller.sellerInfo.socialMedia.instagram = socialMedia.instagram;
      if (socialMedia.facebook) seller.sellerInfo.socialMedia.facebook = socialMedia.facebook;
    }
    if (rating !== undefined) seller.sellerInfo.rating = rating;
    if (followers !== undefined) seller.sellerInfo.followers = followers;

    await seller.save();

    res.status(200).json({
      message: 'Profil seller berhasil diperbarui.',
      seller: {
        id: seller._id,
        store: seller.sellerInfo.store,
        socialMedia: seller.sellerInfo.socialMedia,
        rating: seller.sellerInfo.rating,
        followers: seller.sellerInfo.followers,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Gagal memperbarui profil seller.',
      error: error.message,
    });
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
