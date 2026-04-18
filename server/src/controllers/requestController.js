const Request = require("../models/Request");
const Pet = require("../models/Pet");
const appDataService = require("../services/appDataService");
const authDataService = require("../services/authDataService");

const useMongo = () => Boolean(process.env.MONGODB_URI);

const createRequest = async (req, res) => {
  const { petId, requestType, note } = req.body;
  const userId = req.user.id || req.user._id;

  const pet = useMongo() ? await Pet.findById(petId) : await appDataService.getPetById(petId);
  if (!pet) {
    return res.status(404).json({ success: false, message: "Pet not found" });
  }

  if (!pet.isAvailable) {
    return res.status(400).json({ success: false, message: "Pet is not available" });
  }

  const existing = useMongo()
    ? await Request.findOne({
        client: userId,
        pet: petId,
        status: { $in: ["pending", "approved"] },
      })
    : await appDataService.findActiveRequestByClientAndPet(userId, petId);

  if (existing) {
    return res.status(409).json({ success: false, message: "Request already exists" });
  }

  const request = useMongo()
    ? await Request.create({
        client: userId,
        pet: petId,
        requestType,
        note: note || "",
        amount: requestType === "buy" ? pet.price : 0,
      })
    : await appDataService.createRequest({
        clientId: userId,
        petId,
        requestType,
        note: note || "",
        amount: requestType === "buy" ? pet.price : 0,
      });

  return res.status(201).json({ success: true, request });
};

const getMyRequests = async (req, res) => {
  const userId = req.user.id || req.user._id;

  const requests = useMongo()
    ? await Request.find({ client: userId }).populate("pet").sort("-createdAt")
    : (await appDataService.getRequestsByClient(userId)).map((request) => ({
        ...request,
        pet: null,
      }));

  if (!useMongo()) {
    for (const request of requests) {
      request.pet = await appDataService.getPetById(request.petId);
    }
  }

  return res.json({ success: true, requests });
};

const getAllRequests = async (req, res) => {
  const requests = useMongo()
    ? await Request.find().populate("pet").populate("client", "name email").sort("-createdAt")
    : await appDataService.getAllRequests();

  if (!useMongo()) {
    for (const request of requests) {
      request.pet = await appDataService.getPetById(request.petId);
      request.client = await authDataService.getById(request.clientId);
    }
  }

  return res.json({ success: true, requests });
};

const updateRequestStatus = async (req, res) => {
  const { status } = req.body;
  const request = useMongo()
    ? await Request.findById(req.params.id).populate("pet")
    : await appDataService.updateRequestStatus(req.params.id, status);

  if (!request) {
    return res.status(404).json({ success: false, message: "Request not found" });
  }

  if (useMongo()) {
    request.status = status;
    await request.save();
  }

  if (status === "completed") {
    if (useMongo()) {
      await Pet.findByIdAndUpdate(request.pet._id, { isAvailable: false });
    } else {
      await appDataService.setPetAvailability(request.petId, false);
    }
  }

  return res.json({ success: true, request });
};

module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
};
