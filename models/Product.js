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
        default: true,
        index: true // ini buat cek apakah barang itu di drop tiem atau enggak
    },
    dropStart: { // Kapan produk mulai bisa dibeli/ di buka lah
        type: Date,
        required: [true, 'waktu mulai drop (dropStart) wajib diisi'],
    },
    dropEnd: { // Kapan produk sudah tidak bisa dibeli
        type: Date,
        required: [true, 'waktu Akhir drop (dropEnd) wajib diisi'],
    }

}, {
  timestamps: true,
  // virtual field untuk barang
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// middleware diskon otoamtis kalau dia 0 maka false, jika di atas 0 maka jadi true
ProductSchema.pre('save', function(next) {
  if (this.isModified('discount')) {
    this.isDiscount = this.discount > 0;
  }
  next();
});

//field isDropActive untuk cek apakah barang ini masih dalam masa aktif drop/ tidak?
ProductSchema.virtual('isDropActive').get(function() {
  const now = new Date();
  return (now >= this.dropStart && now <= this.dropEnd);
});

//drop status dari barang
ProductSchema.virtual('dropStatus').get(function() {
  const now = new Date();

  if (now < this.dropStart) {
    return 'AkanDatang'; // Belum mulai (Disable tombol)
  } else if (now > this.dropEnd) {
    return 'Berakhir';    // Sudah lewat (Disable tombol)
  } else {
    return 'Aktif';   // Sedang jalan (Bisa beli)
  }
});

// validasi dropEnd tidak aktif sebelum dropStart jalan (tadi bug njir)
ProductSchema.pre('validate', function(next) {
  if (this.dropStart && this.dropEnd && this.dropEnd < this.dropStart) {
    this.invalidate('dropEnd', 'Waktu selesai drop barang tidak boleh sebelum waktu mulai barang di drop');
  }
  next();
});


module.exports = mongoose.model('Product', ProductSchema);