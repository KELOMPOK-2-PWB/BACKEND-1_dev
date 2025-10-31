const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { // Dari 'Nama barang'
    type: String,
    required: true,
    trim: true,
  },
  description: { // Dari 'deskripsi barang'
    type: String,
    required: true,
  },
  category: { // Dari 'Jenis barang'
    type: String,
    required: true,
  },
  price: { 
    type: Number,
    required: true,
  },
  quantity: { // Dari 'Jumlah barang'
    type: Number,
    required: true,
    default: 0,
  },
  sold: { // Dari 'terjual'
    type: Number,
    default: 0,
  },
  isAdvertised: { // Dari 'iklan'
    type: Boolean,
    default: false,
  },
  discount: { // Dari 'diskon'
    type: Number,
    default: 0,
  },
  // Referensi ke user yang menjual produk ini
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // 'User' ini di ambil dari ref users
  },
  rating: { // Dari 'bintang_rating'
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  images: [String],

    isDropItem: {
        type: Boolean,
        default: false,
        index: true // ini buat cek apakah barang itu di drop tiem atau enggak
    },
    dropStart: { // Kapan produk mulai bisa dibeli/ di buka lah
        type: Date,
    },
    dropEnd: { // Kapan produk sudah tidak bisa dibeli
        type: Date,
    }

}, {
  timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);