// File: controllers/userController.js

const User = require('../models/Users');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// @desc    Update profil user (nama, hp, avatar, alamat)
// @route   PUT /api/users/profile
exports.updateUserProfile = async (req, res) => {
    try {
        let userIdToUpdate;

        // Jika yang login adalah admin dan ada ID di parameter URL, admin sedang mengubah data user lain.
        if (['admin', 'superadmin'].includes(req.user.role) && req.params.id) {
            userIdToUpdate = req.params.id;
        } else {
            // Jika tidak, user bisa mengubah datanya sendiri.
            userIdToUpdate = req.user.id;
        }

        //proteksi akses user cuma bisa ganti data nya sendiri gak bisa data orang lain
        if (!['admin', 'superadmin'].includes(req.user.role) && userIdToUpdate.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Akses ditolak. Anda hanya bisa mengubah data Anda sendiri.' });
        }

        // Ambil data user dari database
        const user = await User.findById(userIdToUpdate);

        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        // update setiap field yang diizinkan HANYA jika ada data baru yang dikirim.
        user.name = req.body.name || user.name;
        user.username = req.body.username || user.username;
        user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
        user.avatar = req.body.avatar || user.avatar;

        // Gabungkan data alamat lama dan baru untuk memungkinkan update parsial
        if (req.body.address) {
            user.address = { ...user.address.toObject(), ...req.body.address };
        }

        // save apa yang user update ke database
        const updatedUser = await user.save();

        // Kirim kembali data yang sudah diperbarui sebagai konfirmasi.
        res.status(200).json({
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            username: updatedUser.username,
            phoneNumber: updatedUser.phoneNumber,
            avatar: updatedUser.avatar,
            address: updatedUser.address,
        });

    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};


// @desc    Memulai proses update email (mengirim OTP ke email baru)
// @route   POST /api/users/request-email-update
exports.requestEmailUpdate = async (req, res) => {
    const { newEmail } = req.body;
    if (!newEmail) {
        return res.status(400).json({ message: 'Email baru tidak boleh kosong' });
    }

    try {
        const emailExists = await User.findOne({ email: newEmail });
        if (emailExists) {
            return res.status(400).json({ message: 'Email baru sudah digunakan' });
        }

        // Ambil user dari database
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan."});
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
        // Set semua data baru di objek user
        user.unverifiedEmail = newEmail;
        user.otp = await bcrypt.hash(otp, 10);
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        user.otpRequestTimestamp = Date.now();

    // otp verif email berubah user
        await resend.emails.send({
            from: 'noreply@ashura.web.id',
            to: newEmail,
            subject: 'Verifikasi Perubahan Email Anda',
            html: `<div style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);">
      
      <div style="background: #1a73e8; padding: 20px; text-align: center;">
        <img src="https://uploader.danafxc.my.id/images/cd25b0b1-75fb-48de-bc6e-07525ad8cdc0.png" alt="Logo Ashura" style="width: 120px; margin-bottom: 5px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Verifikasi Email</h1>
      </div>

      <div style="padding: 30px 20px;">
        <p style="font-size: 16px; color: #333333;">
          Hai, terima kasih telah melakukan permintaan perubahan email.
        </p>
        <p style="font-size: 16px; color: #333333;">
          Silakan gunakan kode OTP berikut untuk memverifikasi perubahan email Anda:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1a73e8;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #666666;">
          Kode ini hanya berlaku selama 10 menit. Jika Anda tidak melakukan permintaan ini, silakan abaikan email ini.
        </p>
      </div>

      <div style="background: #f1f1f1; padding: 10px; text-align: center; color: #555555; font-size: 12px;">
        &copy; 2025 Ashura Web ID. Semua hak dilindungi.
      </div>

    </div>
  </div>`
        });
        await user.save();

        res.status(200).json({ message: `OTP telah dikirim ke ${newEmail}` });

    } catch (error) {
        console.error("Error during email update request:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};


// @desc    Memverifikasi OTP untuk mengaktifkan email baru
// @route   POST /api/users/verify-email-update
exports.verifyEmailUpdate = async (req, res) => {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'OTP tidak boleh kosong' });

    try {
        console.log(`--- Mencari user dengan ID: ${req.user.id} dan OTP yang belum expired ---`);
        const user = await User.findOne({
            _id: req.user.id,
            otpExpires: { $gt: Date.now() }
        }).select('+otp +unverifiedEmail'); // Ambil field otp & unverifiedEmail

        // DEBUGGING LOG tadi error di sini jangan di delete !!!!
        console.log("HASIL DARI DATABASE:", user);

        if (!user || !user.unverifiedEmail || !user.otp) {
            return res.status(400).json({ message: 'Permintaan tidak valid atau OTP kedaluwarsa' });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            console.log("DEBUG: Perbandingan OTP Gagal!");
            return res.status(400).json({ message: 'OTP salah' });
        }

        user.email = user.unverifiedEmail;
        user.unverifiedEmail = undefined;
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        res.status(200).json({ message: 'Email berhasil diperbarui' });

    } catch (error) {
        console.error("Error during OTP verification:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};


// @desc    Update password user
// @route   PUT /api/users/change-password
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    try {
        const user = await User.findById(req.user.id).select('+password');

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password saat ini salah' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password berhasil diubah' });

    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};



// @desc    Get profil user
// @route   GET /api/users/profile
exports.getUserProfile = async (req, res) => {
    const user = req.user;

    if (user) {
        res.status(200).json({
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            phoneNumber: user.phoneNumber,
            address: user.address,
            role: user.role,
            createdAt: user.createdAt,
        });
    } else {
        return res.status(404).json({ message: 'User tidak ditemukan' });
    }
};


//@desc delete user account
//@route DELETE /api/users/delete-account
exports.deleteUserAccount = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email dan password konfirmasi wajib diisi.' });
        }
        const user = await User.findById(req.user.id).select('+password');
        if (user.email !== email) {
            return res.status(401).json({ message: 'Email tidak cocok.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password salah.' });
        }

        //kalau semua verifikasi berhasil, hapus user
        await User.findByIdAndDelete(req.user.id);

        res.status(200).json({ message: 'Akun Anda telah berhasil dihapus secara permanen.' });

    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};


// @desc geraddress
// @route GET /api/users/address
exports.getAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json(user.address);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};


// @desc PostAddress
// @route Post /api/users/address

exports.addAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // Data alamat baru dari body
        const newAddress = {
            street: req.body.street,
            city: req.body.city,
            province: req.body.province,
            postalCode: req.body.postalCode,
            addressNotes: req.body.addressNotes,
            isDefaultAddress: req.body.isDefaultAddress || false,
        };
        user.address.push(newAddress);
        await user.save();
        res.status(201).json(user.address);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};

// @desc    Update an existing address
// @route   PUT /api/users/address/:addressId
exports.updateAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const address = user.address.id(req.params.addressId);

        if (!address) {
            return res.status(404).json({ message: 'Alamat tidak ditemukan' });
        }

        // Update field yang ada di body request
        address.street = req.body.street || address.street;
        address.city = req.body.city || address.city;
        address.province = req.body.province || address.province;
        address.postalCode = req.body.postalCode || address.postalCode;
        address.addressNotes = req.body.addressNotes || address.addressNotes;
        if (typeof req.body.isDefaultAddress === 'boolean') {
            address.isDefaultAddress = req.body.isDefaultAddress;
        }

        await user.save();

        res.status(200).json(user.address);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};

// @desc    Delete an address
// @route   DELETE /api/users/address/:addressId
exports.deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        // cari alamat yang akan dihapus
        const address = user.address.id(req.params.addressId);

        if (!address) {
            return res.status(404).json({ message: 'Alamat tidak ditemukan' });
        }

        // Hapus alamat dari array
        address.deleteOne();

        await user.save();

        res.status(200).json({ message: 'Alamat berhasil dihapus', address: user.address });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};
