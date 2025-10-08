
//ENV prosess
require('dotenv').config();

//env utama
const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const authenticateToken = require('./middleware/authBackend');


const corsOptions = {
  origin: process.env.FRONTEND_URL, // ini url dari frontend
  optionsSuccessStatus: 200
};



//use app module
app.use(morgan('dev'))
app.use(cors(corsOptions));
app.use(authenticateToken); // header wajib untuk akses ke db biar gak di abuse

//logger mode pastiin development kalau lagi develop
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}
//jangan di ganti buat arah ke .env
const port = process.env.PORT ;



app.get('/', (req, res) => {
    res.json({
        tes: "titit kuda",
        tes2: "22"
    })
})

const server = app.listen(port, () => {
    console.log(`server backend running di port ${port}`)
})


/* JANGAN DI DELETE BUAT TIMEOUT NYA */
// server.timeout = timeout;
// console.log(`timeout ${timeout} detik.`)