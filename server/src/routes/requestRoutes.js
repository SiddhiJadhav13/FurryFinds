const express = require("express");
const {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
} = require("../controllers/requestController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.post("/", protect, authorize("client"), createRequest);
router.get("/my", protect, authorize("client"), getMyRequests);
router.get("/", protect, authorize("admin"), getAllRequests);
router.patch("/:id/status", protect, authorize("admin"), updateRequestStatus);

module.exports = router;
