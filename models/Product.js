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
  isDiscount: { // Dari 'diskon'
    type: Boolean,
    default: false,
  },
  discount: { // Update bagian ini
    type: Number,
    default: 0,
    min: [0, 'diskon gak boleh kurang dari 0%'],
    max: [99, 'diskon gak boleh lebih dari 99%']
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

// middleware diskon otoamtis kalau dia 0 maka false, jika di atas 0 maka jadi true
ProductSchema.pre('save', function(next) {
  if (this.isModified('discount')) {
    this.isDiscount = this.discount > 0;
  }
  next();
});


module.exports = mongoose.model('Product', ProductSchema);