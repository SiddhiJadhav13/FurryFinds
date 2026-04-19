const Pet = require("../models/Pet");
const appDataService = require("../services/appDataService");
const { uploadFiles } = require("../services/storageService");

const useMongo = () => Boolean(process.env.MONGODB_URI);

const buildFilters = (query) => {
  const filters = {};

  if (query.category) filters.category = query.category;
  if (query.breed) filters.breed = new RegExp(query.breed, "i");
  if (query.search) {
    filters.$or = [
      { name: new RegExp(query.search, "i") },
      { breed: new RegExp(query.search, "i") },
      { description: new RegExp(query.search, "i") },
    ];
  }

  if (query.minAge || query.maxAge) {
    filters.age = {};
    if (query.minAge) filters.age.$gte = Number(query.minAge);
    if (query.maxAge) filters.age.$lte = Number(query.maxAge);
  }

  if (query.minPrice || query.maxPrice) {
    filters.price = {};
    if (query.minPrice) filters.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filters.price.$lte = Number(query.maxPrice);
  }

  if (query.available === "true") {
    filters.isAvailable = true;
  }

  return filters;
};

const getAllPets = async (req, res) => {
  const filters = buildFilters(req.query);
  const sort = req.query.sort || "-createdAt";

  const pets = useMongo()
    ? await Pet.find(filters).sort(sort).populate("postedBy", "name email")
    : await appDataService.getPets({ filters, sort });

  return res.json({ success: true, count: pets.length, pets });
};

const getPetById = async (req, res) => {
  const pet = useMongo()
    ? await Pet.findById(req.params.id).populate("postedBy", "name email")
    : await appDataService.getPetById(req.params.id);

  if (!pet) {
    return res.status(404).json({ success: false, message: "Pet not found" });
  }

  return res.json({ success: true, pet });
};

const createPet = async (req, res) => {
  let images = (req.files || []).map((file) => `/uploads/${file.filename}`);

  // If files were uploaded via multer, attempt to upload them to Supabase
  if ((req.files || []).length > 0) {
    try {
      const urls = await uploadFiles(req.files || []);
      if (urls && urls.length) images = urls;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to upload files to storage:", error.message || error);
    }
  }

  const userId = req.user.id || req.user._id;

  const pet = useMongo()
    ? await Pet.create({
        ...req.body,
        age: Number(req.body.age),
        price: Number(req.body.price),
        images,
        postedBy: userId,
      })
    : await appDataService.createPet({
        ...req.body,
        age: Number(req.body.age),
        price: Number(req.body.price),
        images,
        postedBy: userId,
      });

  return res.status(201).json({ success: true, pet });
};

const updatePet = async (req, res) => {
  const pet = useMongo() ? await Pet.findById(req.params.id) : await appDataService.getPetById(req.params.id);

  if (!pet) {
    return res.status(404).json({ success: false, message: "Pet not found" });
  }

  let newImages = (req.files || []).map((file) => `/uploads/${file.filename}`);
  if ((req.files || []).length > 0) {
    try {
      const urls = await uploadFiles(req.files || []);
      if (urls && urls.length) newImages = urls;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to upload files to storage:", error.message || error);
    }
  }
  const existingImages = req.body.existingImages
    ? Array.isArray(req.body.existingImages)
      ? req.body.existingImages
      : [req.body.existingImages]
    : pet.images;

  const updated = useMongo()
    ? await Pet.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          age: Number(req.body.age),
          price: Number(req.body.price),
          images: [...existingImages, ...newImages],
        },
        { new: true, runValidators: true }
      )
    : await appDataService.updatePet(req.params.id, {
        ...req.body,
        age: Number(req.body.age),
        price: Number(req.body.price),
        images: [...existingImages, ...newImages],
      });

  return res.json({ success: true, pet: updated });
};

const deletePet = async (req, res) => {
  const pet = useMongo()
    ? await Pet.findByIdAndDelete(req.params.id)
    : await appDataService.deletePet(req.params.id);
  if (!pet) {
    return res.status(404).json({ success: false, message: "Pet not found" });
  }

  return res.json({ success: true, message: "Pet deleted" });
};

module.exports = {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
};
