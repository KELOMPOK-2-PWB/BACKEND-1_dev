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
  getAllUsers,
  getUserById,
  // adminUpdateUser,
  deleteUser,
} = require("../controllers/adminController");


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

// ========== (admin ke user) ==========
router.get("/users", getAllUsers);
router.get("/user/:id", getUserById); 
// router.put("/user/update/:id", adminUpdateUser); 
router.delete("/user/delete/:id", deleteUser);


// router
//   .route("/profile")
//   .get(getUserProfile) 
//   .put(updateUserProfile); 

// router.put("/change-password", changePassword);


module.exports = router;

