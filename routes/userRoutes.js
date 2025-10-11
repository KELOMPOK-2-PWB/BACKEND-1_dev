const express = require('express');
const router = express.Router();

const { getUserProfile, updateUserProfile, changePassword, requestEmailUpdate, verifyEmailUpdate, deleteUserAccount } = require('../controllers/userController');

const { getAddress, addAddress, updateAddress, deleteAddress } = require('../controllers/userController');

const { protect, authorize } = require('../middleware/protectMiddleware');

// protect dan authorize di sini
// jadi setiap role nanti sendiri sendiri, seller gak bisa ke sini
router.route('/profile')
    .get(protect, authorize('user', 'admin', 'superadmin'), getUserProfile)
    .put(protect, authorize('user', 'admin', 'superadmin'), updateUserProfile)
    .delete(protect, authorize('user', 'admin', 'superadmin'), deleteUserAccount);

router.put('/change-password', protect, authorize('user', 'admin', 'superadmin'), changePassword);
router.post('/request-email-update', protect, authorize('user', 'admin', 'superadmin'), requestEmailUpdate);
router.post('/verify-email-update', protect, authorize('user', 'admin', 'superadmin'), verifyEmailUpdate);

router.route('/address')
    .get(protect, authorize('user', 'admin', 'superadmin'), getAddress)
    .post(protect, authorize('user', 'admin', 'superadmin'), addAddress);

router.route('/address/:addressId')
    .put(protect, authorize('user', 'admin', 'superadmin'), updateAddress)
    .delete(protect, authorize('user', 'admin', 'superadmin'), deleteAddress);

module.exports = router;