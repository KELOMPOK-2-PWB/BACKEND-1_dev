// const express = require('express');
// const router = express.Router();
// const {
//   createProduct,
//   getSellerProducts,
//   updateProduct,
//   deleteProduct
// } = require('../controllers/productController');

// const { protect, authorize } = require('../middleware/protectMiddleware');
// const authBackend = require('../middleware/authBackend');

// // Semua route product lewat verifikasi backend + JWT seller
// router.use(authBackend);

// router.post('/', protect, authorize('seller'), createProduct);
// router.get('/', protect, authorize('seller'), getSellerProducts);
// router.put('/:id', protect, authorize('seller'), updateProduct);
// router.delete('/:id', protect, authorize('seller'), deleteProduct);

// module.exports = router;