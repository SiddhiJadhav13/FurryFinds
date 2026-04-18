const express = require("express");
const {
  getAllKnowledgePosts,
  getKnowledgePostById,
  createKnowledgePost,
  updateKnowledgePost,
  deleteKnowledgePost,
} = require("../controllers/knowledgeController");
const { protect, authorize } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

const router = express.Router();

router.get("/", getAllKnowledgePosts);
router.get("/:id", getKnowledgePostById);
router.post("/", protect, authorize("admin"), upload.single("coverImage"), createKnowledgePost);
router.put("/:id", protect, authorize("admin"), upload.single("coverImage"), updateKnowledgePost);
router.delete("/:id", protect, authorize("admin"), deleteKnowledgePost);

module.exports = router;
