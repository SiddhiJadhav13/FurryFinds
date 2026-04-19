const express = require("express");
const {
  getProfile,
  updateProfile,
  getDashboardStats,
  toggleWishlist,
  getWishlist,
  contactAdmin,
  getContactMessages,
} = require("../controllers/userController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/stats", protect, getDashboardStats);
router.get("/wishlist", protect, authorize("client"), getWishlist);
router.post("/wishlist/:petId", protect, authorize("client"), toggleWishlist);
router.post("/contact", protect, authorize("client"), contactAdmin);
router.get("/contact", protect, authorize("admin"), getContactMessages);

module.exports = router;
