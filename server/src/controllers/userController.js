const User = require("../models/User");
const Pet = require("../models/Pet");
const ContactMessage = require("../models/ContactMessage");
const authDataService = require("../services/authDataService");
const appDataService = require("../services/appDataService");
const {
  ensureProfileAndStats,
  getProfileById,
  updateProfileById,
  syncClientStats,
  syncAdminStats,
} = require("../services/supabaseProfileService");

const useMongo = () => Boolean(process.env.MONGODB_URI);
const currentUserId = (req) => req.user.id || req.user._id;
const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );

const getProfile = async (req, res) => {
  const id = currentUserId(req);
  let profile = null;

  if (isUuid(id)) {
    const ensured = await ensureProfileAndStats({
      id,
      email: req.user.email,
      role: req.user.role,
      fullName: req.user.name || req.user.full_name || req.user.email,
    });
    profile = (await getProfileById(id)) || ensured;
  } else {
    const legacyUser = await authDataService.getById(id);
    if (legacyUser) {
      profile = {
        id: legacyUser.id,
        full_name: legacyUser.name || "",
        email: legacyUser.email || "",
        phone: legacyUser.phone || "",
        address: legacyUser.address || "",
        gender: "",
        dob: null,
        profile_image: legacyUser.avatar || "",
        role: legacyUser.role || "client",
        created_at: legacyUser.created_at || null,
      };
    }
  }

  const wishlist = await appDataService.getWishlistPets(id);

  const user = {
    ...profile,
    wishlist,
  };

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.json({ success: true, user });
};

const updateProfile = async (req, res) => {
  const id = currentUserId(req);
  const { full_name, email, phone, address, gender, dob, profile_image } = req.body;

  let updated = null;
  if (isUuid(id)) {
    updated = await updateProfileById(id, {
      full_name,
      email,
      phone,
      address,
      gender,
      dob,
      profile_image,
    });
  } else {
    const legacy = await authDataService.updateUserProfile(id, {
      name: full_name,
      phone,
      address,
      avatar: profile_image,
    });

    if (legacy) {
      updated = {
        id: legacy.id,
        full_name: legacy.name || "",
        email: legacy.email || "",
        phone: legacy.phone || "",
        address: legacy.address || "",
        gender: gender || "",
        dob: dob || null,
        profile_image: legacy.avatar || "",
        role: legacy.role || "client",
        created_at: legacy.created_at || null,
      };
    }
  }

  const user = {
    ...(updated || (isUuid(id) ? await getProfileById(id) : null)),
    wishlist: await appDataService.getWishlistPets(id),
  };

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.json({ success: true, user });
};

const getDashboardStats = async (req, res) => {
  const id = currentUserId(req);
  const role = String(req.user.role || "client").toLowerCase();

  if (!isUuid(id)) {
    if (role === "admin") {
      const [pets, requests, users] = await Promise.all([
        appDataService.getPets({ filters: {}, sort: "-createdAt" }),
        appDataService.getAllRequests(),
        authDataService.listUsers(),
      ]);

      return res.json({
        success: true,
        role,
        stats: {
          id,
          total_pets: pets.length,
          pending_requests: requests.filter((item) => item.status === "pending").length,
          approved_requests: requests.filter((item) => item.status === "approved").length,
          rejected_requests: requests.filter((item) => item.status === "rejected").length,
          total_users: users.filter((item) => item.role === "client").length,
        },
      });
    }

    const [requests, wishlist] = await Promise.all([
      appDataService.getRequestsByClient(id),
      appDataService.getWishlistPetIds(id),
    ]);

    return res.json({
      success: true,
      role,
      stats: {
        id,
        saved_pets_count: wishlist.length,
        total_requests: requests.length,
        approved_requests: requests.filter((item) => item.status === "approved").length,
      },
    });
  }

  if (role === "admin") {
    const stats = await syncAdminStats(id);
    return res.json({ success: true, role, stats });
  }

  const stats = await syncClientStats(id);
  return res.json({ success: true, role, stats });
};

const toggleWishlist = async (req, res) => {
  const { petId } = req.params;
  const pet = useMongo() ? await Pet.findById(petId) : await appDataService.getPetById(petId);

  if (!pet) {
    return res.status(404).json({ success: false, message: "Pet not found" });
  }

  if (useMongo()) {
    const user = await User.findById(currentUserId(req));
    const exists = user.wishlist.some((id) => id.toString() === petId);

    if (exists) {
      user.wishlist = user.wishlist.filter((id) => id.toString() !== petId);
    } else {
      user.wishlist.push(petId);
    }

    await user.save();
    const populated = await User.findById(currentUserId(req)).populate("wishlist");
    return res.json({ success: true, wishlist: populated.wishlist });
  }

  const wishlist = await appDataService.toggleWishlistPet(currentUserId(req), petId);
  return res.json({ success: true, wishlist });
};

const getWishlist = async (req, res) => {
  if (useMongo()) {
    const user = await User.findById(currentUserId(req)).populate("wishlist");
    return res.json({ success: true, wishlist: user.wishlist });
  }

  const wishlist = await appDataService.getWishlistPets(currentUserId(req));
  return res.json({ success: true, wishlist });
};

const contactAdmin = async (req, res) => {
  const { subject, message } = req.body;

  const contact = useMongo()
    ? await ContactMessage.create({
        sender: currentUserId(req),
        subject,
        message,
      })
    : await appDataService.createContactMessage({
        sender: currentUserId(req),
        subject,
        message,
      });

  return res.status(201).json({ success: true, contact });
};

const getContactMessages = async (req, res) => {
  const messages = useMongo()
    ? await ContactMessage.find().populate("sender", "name email").sort("-createdAt")
    : await appDataService.getContactMessages();

  if (!useMongo()) {
    for (const message of messages) {
      message.sender = await authDataService.getById(message.sender);
    }
  }

  return res.json({ success: true, messages });
};

module.exports = {
  getProfile,
  updateProfile,
  getDashboardStats,
  toggleWishlist,
  getWishlist,
  contactAdmin,
  getContactMessages,
};
