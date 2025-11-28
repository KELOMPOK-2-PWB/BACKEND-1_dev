const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protectMiddleware");

const {
  getAllSellers,
  getSellerById,
  searchSellersByName,
  adminUpdateSeller,
  deleteSeller,
  verifySeller,
  adminUpdateProduct,
  adminDeleteProduct,
  adminGetAllProducts,
  getAllUsers,
  getUserById,
  searchUsersByName,
  adminUpdateUser,
  deleteUser,
  adminBannedUserSeller,
} = require("../controllers/adminController");


router.use(protect);
router.use(authorize("admin"));


// ========== (admin ke seller) ==========
router.get("/sellers", getAllSellers);
router.get("/seller/:id", getSellerById);
router.get("/seller/search/name", searchSellersByName);
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
router.get("/user/search/name", searchUsersByName)
router.put("/user/updateData/:id", adminUpdateUser);
router.delete("/user/delete/:id", deleteUser);


// =========== (Campuran) ==============
router.put("/userseller/banned/:id", adminBannedUserSeller);


// router
//   .route("/profile")
//   .get(getUserProfile) 
//   .put(updateUserProfile); 

// router.put("/change-password", changePassword);


module.exports = router;

