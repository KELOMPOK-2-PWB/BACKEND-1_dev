const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protectMiddleware");

const {
  getAllSellers,
  adminUpdateSeller,
  deleteSeller,
  adminUpdateProduct,
  adminDeleteProduct,
} = require("../controllers/adminController");

const {
  getUserProfile,
  updateUserProfile,
  changePassword,
} = require("../controllers/userController");

router.use(protect);
router.use(authorize("admin"));

router.get("/sellers", getAllSellers);
// router.put("/sellers/:id/verify", verifySeller); 
router.put("/seller/updateData/:id", adminUpdateSeller); 
router.delete("/seller/delete/:id", deleteSeller); 

// router.put("/products/:id", adminUpdateProduct); 
// router.delete("/products/:id", adminDeleteProduct); 


// router
//   .route("/profile")
//   .get(getUserProfile) 
//   .put(updateUserProfile); 

// router.put("/change-password", changePassword);


module.exports = router;

