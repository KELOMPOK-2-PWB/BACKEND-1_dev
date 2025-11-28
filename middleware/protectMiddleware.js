const jwt = require('jsonwebtoken');
const User = require('../models/Users');

exports.protect = async (req, res, next) => {
    let token; //token yang di ambil dari header

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password +isBanned');
            // ===== JANGAN DI DELETE, INI JADI ACUAN KALAU MISAL NYA GAK DI PAKAI
            // req.user = await User.findById(decoded.id).select('-password +isBanned');
            if (!user) {
                return res.status(401).json({ message: 'User tidak ditemukan' });
            }
            if (user.isBanned) {
                return res.status(403).json({
                    message: 'Akses Ditolak. Akun ini telah DIBOKIR.'
                });
            }
            req.user = user; // ambil dari user jadi semua di ambil dari variabel user di DB
            next();
        } catch (error) {
            // ======== DI PAKAI KALAU MAU DEBUG ERROR KETIKA USER GAK BISA LOGIN
            // console.error(error.message);
            // console.error(error);
            return res.status(401).json({ message: 'Token Login tidak valid ditolak' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Tidak ada token Login, ditolak' });
    }
};
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Akses ditolak. Role '${req.user.role}' tidak diizinkan untuk mengakses ini.`
            });
        }
        next();
    };
};