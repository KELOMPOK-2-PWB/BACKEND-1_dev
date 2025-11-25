const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protectMiddleware");

const {
  getAllSellers,
  adminUpdateSeller,
  deleteSeller,
  verifySeller,
  adminUpdateProduct,
  adminDeleteProduct,
  adminGetAllProducts,
} = require("../controllers/adminController");

const {
  getUserProfile,
  updateUserProfile,
  changePassword,
} = require("../controllers/userController");

router.use(protect);
router.use(authorize("admin"));


// ========== (admin ke serller) ==========
router.get("/sellers", getAllSellers);
router.put("/seller/:id/verify", verifySeller); 
router.put("/seller/updateData/:id", adminUpdateSeller); 
router.delete("/seller/delete/:id", deleteSeller); 


// ========== (admin ke produk) ==========
router.get("/productsSeller", adminGetAllProducts);
router.put("/productSeller/Update/:id", adminUpdateProduct); 
router.delete("/productSeller/Delete/:id", adminDeleteProduct); 


// router
//   .route("/profile")
//   .get(getUserProfile) 
//   .put(updateUserProfile); 

// router.put("/change-password", changePassword);


module.exports = router;

