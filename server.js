
//ENV prosess
require('dotenv').config();

//env utama
const express = require('express');
const app = express();
const morgan = require('morgan');



//use app module
app.use(morgan('dev'))

//jangan di ganti buat arah ke .env
const port = process.env.PORT ;
// const timeout = process.env.SERVER_TIMEOUT ;


app.get('/', (req, res) => {
    res.json({
        tes: "titit kuda"
    })
})

const server = app.listen(port, () => {
    console.log(`server backend running di port ${port}`)
})


/* JANGAN DI DELETE BUAT TIMEOUT NYA */
// server.timeout = timeout;
// console.log(`timeout ${timeout} detik.`)