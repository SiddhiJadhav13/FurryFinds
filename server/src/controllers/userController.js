const User = require("../models/User");
const Pet = require("../models/Pet");
const ContactMessage = require("../models/ContactMessage");
const authDataService = require("../services/authDataService");
const appDataService = require("../services/appDataService");

const useMongo = () => Boolean(process.env.MONGODB_URI);
const currentUserId = (req) => req.user.id || req.user._id;

const getProfile = async (req, res) => {
  const user = useMongo()
    ? await User.findById(currentUserId(req)).populate("wishlist")
    : {
        ...(await authDataService.getById(currentUserId(req))),
        wishlist: await appDataService.getWishlistPets(currentUserId(req)),
      };

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.json({ success: true, user });
};

const updateProfile = async (req, res) => {
  const { name, phone, address, avatar } = req.body;

  const user = useMongo()
    ? await User.findByIdAndUpdate(
        currentUserId(req),
        { name, phone, address, avatar },
        { new: true }
      ).populate("wishlist")
    : {
        ...(await authDataService.updateUserProfile(currentUserId(req), { name, phone, address, avatar })),
        wishlist: await appDataService.getWishlistPets(currentUserId(req)),
      };

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.json({ success: true, user });
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
  toggleWishlist,
  getWishlist,
  contactAdmin,
  getContactMessages,
};
