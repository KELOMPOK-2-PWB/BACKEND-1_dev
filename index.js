
//ENV prosess
require('dotenv').config();

//env utama
const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const authenticateToken = require('./middleware/authBackend');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');


//db connection
connectDB();

const corsOptions = {
  origin: process.env.FRONTEND_URL, // ini url dari frontend
  optionsSuccessStatus: 200
};



//use app module
app.use(morgan('dev')) //kalau log gak jalan ini aktifin aja, kalau double baru di matiin di mac gua -dana gak mau jalan log nya
app.use(cors(corsOptions));
app.use(express.json());
app.use(authenticateToken); // header wajib untuk akses ke db biar gak di abuse

//logger mode pastiin development kalau lagi develop
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}
//jangan di ganti buat arah ke .env
const port = process.env.PORT ;



// app.get('/', (req, res) => {
//     res.json({
//         tes: "tes dev",
//     })
// })


// semua route di routes bakal ada di bawah sini
app.use('/api/auth', authRoutes);

const server = app.listen(port, () => {
    console.log(`server backend running di port ${port}`)
})


/* JANGAN DI DELETE BUAT TIMEOUT NYA */
// server.timeout = timeout;
// console.log(`timeout ${timeout} detik.`)