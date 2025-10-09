const User = require('../models/Users');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

// @desc    Register user baru
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { email, password, phoneNumber, username } = req.body;
        if (!email || !password || !username) { //cek validasi users dari email password dan username
            return res.status(400).json({ message: 'Email, username, dan password tidak boleh kosong' });
        }


        // validasi users
        const errors = [];
        if (!email) {
            errors.push({ field: 'email', message: 'Email tidak boleh kosong' });
        }
        if (!username) {
            errors.push({ field: 'username', message: 'Username tidak boleh kosong' });
        }
        if (!password) {
            errors.push({ field: 'password', message: 'Password tidak boleh kosong' });
        }
        if (!phoneNumber) {
            errors.push({ field: 'phoneNumber', message: 'phoneNumber tidak boleh kosong' });
        }
        // Anda juga bisa menambahkan validasi lain, misalnya panjang password
        if (password && password.length < 6) {
            errors.push({ field: 'password', message: 'Password minimal harus 6 karakter' });
        }

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }
        // Cek jika user sudah ada
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Email atau username sudah terdaftar' });
        }


        // buat user baruu (password akan di-hash oleh pre-save hook di model User)
        const user = new User({
            name: username, // Default name ke username
            email,
            password,
            phoneNumber,
            username,
        });

        await user.save();

        res.status(201).json({
            message: 'Registrasi berhasil',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;
        const errors = [];
        if (!emailOrUsername) {
            errors.push({ field: 'emailOrUsername', message: 'Email/username tidak boleh kosong' });
        }
        if (!password) {
            errors.push({ field: 'password', message: 'Password tidak boleh kosong' });
        }

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }
        if (!emailOrUsername || !password) {
            return res.status(400).json({ message: 'Email/username dan password tidak boleh kosong' });
        }
        const user = await User.findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
        }).select('+password');

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Email/username atau password salah' });
        }
        const token = generateToken(user._id, user.role);

        res.status(200).json({
            message: 'Login berhasil',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};