const User = require('../models/Users');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const { Resend } = require('resend');
const crypto = require('crypto');


const resend = new Resend(process.env.RESEND_API_KEY);


// @desc    regisster user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { email, password, phoneNumber, username } = req.body;

        // cek validasi users harus ada semua gak mau tahu
        const errors = [];
        if (!email) errors.push(
            {
                field: 'email', message: 'Email tidak boleh kosong'
            }
            );
        if (!username) errors.push(
            {
            field: 'username', message: 'Username tidak boleh kosong'
        }
        );
        if (!password) errors.push(
            {
                field: 'password', message: 'Password tidak boleh kosong'
            }
            );
        if (!phoneNumber) errors.push(
            {
                field: 'phoneNumber', message: 'phoneNumber tidak boleh kosong'
            }
        );
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Email atau username sudah terdaftar' });
        }
        const user = new User({
            name: username,
            email,
            password,
            phoneNumber,
            username,
        });

        // INI COOLDOWN USERS SEND OTP BIAR GAK DI BLOCK NJIR, di env di atur nya
        const cooldownSeconds = parseInt(process.env.OTP_COOLDOWN_SECONDS, 10);
        if (user.otpRequestTimestamp) {
            // Cek apakah user telah meminta OTP dalam cooldown
            const timeElapsed = (Date.now() - user.otpRequestTimestamp.getTime()) / 1000;
            if (timeElapsed < cooldownSeconds) {
                const timeLeft = Math.ceil(cooldownSeconds - timeElapsed);
                return res.status(429).json({ message: `Anda terlalu sering meminta OTP. Silakan coba lagi dalam ${timeLeft} detik.` });
            }
        }


        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = await bcrypt.hash(otp, 10);
        user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP berlaku 10 menit
        user.otpRequestTimestamp = Date.now();
        
        try {
            await resend.emails.send({
                from: 'noreply@ashura.web.id',
                to: user.email,
                subject: 'Kode Verifikasi Anda',
                html: `<div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);">
      
      <!-- Header yang ada logo nya -->
      <div style="text-align: center; padding: 30px 20px; background-color: #0D0D0D;">
        <img src="https://uploader.danafxc.my.id/images/cd25b0b1-75fb-48de-bc6e-07525ad8cdc0.png" alt="Logo Perusahaan" style="width: 120px; margin-bottom: 10px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Verifikasi Akun Anda</h1>
      </div>

        <!-- Body  -->
      <div style="padding: 30px 20px; color: #333333;">
        <p style="font-size: 16px;">Halo <strong>${user.username}</strong>,</p>
        <p style="font-size: 16px; margin-top: -5px;">Gunakan kode OTP ini untuk memverifikasi akun Anda. Kode ini berlaku selama <strong>10 menit</strong>:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #e53935;">
            ${otp}
          </span>
        </div>
        
        <p style="font-size: 14px; color: #666666;">Jika Anda tidak melakukan permintaan ini, abaikan email ini.</p>
      </div>

      <!-- Footer anjay baru tahu gua bisa -->
      <div style="background-color: #f1f1f1; padding: 15px; text-align: center; color: #777777; font-size: 12px;">
        &copy; 2025 Ashura Web ID. 
      </div>

    </div>
  </div>`
            });
            await user.save();

            res.status(201).json({
                message: 'Registrasi berhasil. Kode OTP telah dikirim ke email Anda.',
            });

        } catch (emailError) {
            console.error("Email sending error:", emailError);
            return res.status(500).json({ message: 'Gagal mengirim email verifikasi. Silakan coba lagi.' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
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
        if (!user.isEmailVerified) {
            return res.status(403).json({ message: 'Login gagal. Akun Anda belum diverifikasi.' });
        }

        const token = generateToken(user._id, user.role);

        res.status(200).json({
            message: 'Login berhasil',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};





// @desc    register seller
// @route   POST /api/auth/register-seller

exports.registerSeller = async (req, res) => {
    try {
        const { email, password, phoneNumber, username } = req.body;

        const errors = [];
        if (!email) errors.push({ field: 'email', message: 'Email tidak boleh kosong' });
        if (!username) errors.push({ field: 'username', message: 'Username tidak boleh kosong' });
        if (!password) errors.push({ field: 'password', message: 'Password tidak boleh kosong' });
        if (!password) errors.push({ field: 'phoneNumber', message: 'phoneNumber tidak boleh kosong' });
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Email atau username sudah terdaftar' });
        }
        const user = new User({
            name: username,
            email,
            password,
            phoneNumber,
            username,
            role: 'seller', // Ini buat resgister kalau dia itu saller
        });
        // INI COOLDOWN USERS SEND OTP BIAR GAK DI BLOCK NJIR, di env di atur nya
        const cooldownSeconds = parseInt(process.env.OTP_COOLDOWN_SECONDS, 10);
        if (user.otpRequestTimestamp) {
            // Cek apakah user telah meminta OTP dalam cooldown
            const timeElapsed = (Date.now() - user.otpRequestTimestamp.getTime()) / 1000;
            if (timeElapsed < cooldownSeconds) {
                const timeLeft = Math.ceil(cooldownSeconds - timeElapsed);
                return res.status(429).json({ message: `Anda terlalu sering meminta OTP. Silakan coba lagi dalam ${timeLeft} detik.` });
            }
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = await bcrypt.hash(otp, 10);
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        user.otpRequestTimestamp = Date.now();

        try {
            await resend.emails.send({
                from: 'noreply@ashura.web.id',
                to: user.email,
                subject: 'Kode Verifikasi Pendaftaran Anda menjadi Seller',
                html: `<div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);">
      
      <!-- Header yang ada logo nya -->
      <div style="text-align: center; padding: 30px 20px; background-color: #0D0D0D;">
        <img src="https://uploader.danafxc.my.id/images/cd25b0b1-75fb-48de-bc6e-07525ad8cdc0.png" alt="Logo Perusahaan" style="width: 120px; margin-bottom: 10px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Verifikasi Pendaftaran Toko</h1>
      </div>

      <!-- Body Content -->
      <div style="padding: 30px 20px; color: #333333;">
        <p style="font-size: 16px;">Halo <strong>${user.username}</strong>,</p>
        <p style="font-size: 16px; margin-top: -5px;">Gunakan kode OTP berikut untuk memverifikasi pendaftaran toko Anda. Kode ini berlaku selama <strong>10 menit</strong>:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #e53935;">
            ${otp}
          </span>
        </div>
        
        <p style="font-size: 14px; color: #666666;">Jika Anda tidak melakukan permintaan ini, abaikan email ini.</p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f1f1f1; padding: 15px; text-align: center; color: #777777; font-size: 12px;">
        &copy; 2025 Ashura Web ID.
      </div>

    </div>
  </div>`
            });

            await user.save();

            res.status(201).json({
                message: 'Registrasi seller berhasil. Kode OTP telah dikirim ke email Anda.',
            });

        } catch (emailError) {
            console.error("Email sending error:", emailError);
            return res.status(500).json({ message: 'Gagal mengirim email verifikasi. Silakan coba lagi.' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};









// @desc    verify otp
// @route   POST /api/auth/verify-otp

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email dan OTP tidak boleh kosong' });
        }
        const user = await User.findOne({
            email,
            otpExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ message: 'OTP tidak valid atau sudah kedaluwarsa.' });
        }
        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            return res.status(400).json({ message: 'OTP salah.' });
        }
        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Verifikasi berhasil. Akun Anda kini aktif.' });

    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};


// @desc    Forgot password
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email tidak boleh kosong' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({ message: 'Otp berhasil di kirim ke email anda.' });
        }

        // INI COOLDOWN USERS SEND OTP BIAR GAK DI BLOCK NJIR, di env di atur nya
        const cooldownSeconds = parseInt(process.env.OTP_COOLDOWN_SECONDS, 10);
        if (user.otpRequestTimestamp) {
            // Cek apakah user telah meminta OTP dalam cooldown
            const timeElapsed = (Date.now() - user.otpRequestTimestamp.getTime()) / 1000;
            if (timeElapsed < cooldownSeconds) {
                const timeLeft = Math.ceil(cooldownSeconds - timeElapsed);
                return res.status(429).json({ message: `Anda terlalu sering meminta OTP. Silakan coba lagi dalam ${timeLeft} detik.` });
            }
        }


        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = await bcrypt.hash(otp, 10);
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        user.otpRequestTimestamp = Date.now(); // timestep buat cek user request minta otp

        await resend.emails.send({
            from: 'noreply@ashura.web.id',
            to: user.email,
            subject: 'Kode Reset Password Anda',
            html: `<div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);">
      
      <!-- Header Logo -->
      <div style="text-align: center; padding: 30px 20px; background-color: #0D0D0D;">
        <img src="https://uploader.danafxc.my.id/images/cd25b0b1-75fb-48de-bc6e-07525ad8cdc0.png" alt="Logo Perusahaan" style="width: 120px; margin-bottom: 10px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Reset Password</h1>
      </div>

      <!-- Body Content -->
      <div style="padding: 30px 20px; color: #333333;">
        <p style="font-size: 16px;">Halo,</p>
        <p style="font-size: 16px; margin-top: -5px;">Kami menerima permintaan untuk mereset password akun Anda. Gunakan kode OTP berikut untuk melanjutkan proses reset password. Kode ini berlaku selama <strong>10 menit</strong>:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #e53935;">
            ${otp}
          </span>
        </div>
        
        <p style="font-size: 14px; color: #666666;">Jika Anda tidak melakukan permintaan ini, abaikan email ini.</p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f1f1f1; padding: 15px; text-align: center; color: #777777; font-size: 12px;">
        &copy; 2025 Ashura Web ID.
      </div>

    </div>
  </div>`
        });

        await user.save();

        res.status(200).json({ message: 'Otp berhasil di kirim ke email anda.' });

    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

// @desc    Memverifikasi OTP untuk reset password
// @route   POST /api/auth/verify-reset-otp-password
exports.verifyResetOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: 'Email dan OTP tidak boleh kosong' });
    }

    try {
        const user = await User.findOne({ email, otpExpires: { $gt: Date.now() } });

        if (!user) {
            return res.status(400).json({ message: 'OTP tidak valid atau sudah kedaluwarsa.' });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            return res.status(400).json({ message: 'OTP salah.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Tiket berlaku 10 menit

        // Hapus OTP setelah digunakan
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        // Kirim token reset ke json biar fe bisa pakai
        res.status(200).json({ resetToken });

    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

// @desc    Mereset password dengan token verifikasi
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
    const { email, newPassword, token } = req.body;
    if (!email || !newPassword || !token) {
        return res.status(400).json({ message: 'Email, password baru, dan token wajib diisi' });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            email,
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token reset tidak valid atau sudah kedaluwarsa.' });
        }

        user.password = newPassword;

        // Hapus token reset password setelah digunakan
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: 'Password berhasil direset. Silakan login dengan password baru Anda.' });

    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};
