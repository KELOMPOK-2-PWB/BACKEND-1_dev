const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    console.log(`✅ MongoDB Terhubung cek log nya: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error Koneksi MongoDB tanya dba: ${error.message}`);
    process.exit(1); 
  }
};

module.exports = connectDB;