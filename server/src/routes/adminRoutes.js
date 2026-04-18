const express = require("express");
const { getAnalytics, getUsers, deleteUser } = require("../controllers/adminController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.get("/analytics", protect, authorize("admin"), getAnalytics);
router.get("/users", protect, authorize("admin"), getUsers);
router.delete("/users/:id", protect, authorize("admin"), deleteUser);

module.exports = router;
