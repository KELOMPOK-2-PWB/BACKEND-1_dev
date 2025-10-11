const jwt = require('jsonwebtoken');
const User = require('../models/Users');

exports.protect = async (req, res, next) => {
    let token; //token yang di ambil dari header

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Token tidak valid ditolak' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Tidak ada token, ditolak' });
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