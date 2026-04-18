const express = require("express");
const {
  registerClient,
  registerAdmin,
  loginClient,
  loginAdmin,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.post("/client/signup", registerClient);
router.post("/admin/signup", registerAdmin);
router.post("/client/login", loginClient);
router.post("/admin/login", loginAdmin);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);
router.post("/logout", logout);

module.exports = router;
