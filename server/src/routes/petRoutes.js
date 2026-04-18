const express = require("express");
const {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
} = require("../controllers/petController");
const { protect, authorize } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

const router = express.Router();

router.get("/", getAllPets);
router.get("/:id", getPetById);
router.post("/", protect, authorize("admin"), upload.array("images", 8), createPet);
router.put("/:id", protect, authorize("admin"), upload.array("images", 8), updatePet);
router.delete("/:id", protect, authorize("admin"), deletePet);

module.exports = router;
