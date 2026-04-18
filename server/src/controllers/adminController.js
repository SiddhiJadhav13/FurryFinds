const User = require("../models/User");
const Pet = require("../models/Pet");
const Request = require("../models/Request");
const authDataService = require("../services/authDataService");
const appDataService = require("../services/appDataService");

const useMongo = () => Boolean(process.env.MONGODB_URI);

const getAnalytics = async (req, res) => {
  let totalUsers = 0;
  let totalPets = 0;
  let totalRequests = 0;
  let revenue = 0;

  if (useMongo()) {
    const [mongoUsers, mongoPets, mongoRequests, completedSales] = await Promise.all([
      User.countDocuments({ role: "client" }),
      Pet.countDocuments(),
      Request.countDocuments(),
      Request.aggregate([
        { $match: { status: "completed", requestType: "buy" } },
        { $group: { _id: null, revenue: { $sum: "$amount" } } },
      ]),
    ]);

    totalUsers = mongoUsers;
    totalPets = mongoPets;
    totalRequests = mongoRequests;
    revenue = completedSales[0]?.revenue || 0;
  } else {
    const [users, pets, requests] = await Promise.all([
      authDataService.listUsers(),
      appDataService.getPets({ filters: {}, sort: "-createdAt" }),
      appDataService.getAllRequests(),
    ]);

    totalUsers = users.filter((user) => user.role === "client").length;
    totalPets = pets.length;
    totalRequests = requests.length;
    revenue = requests
      .filter((request) => request.status === "completed" && request.requestType === "buy")
      .reduce((sum, request) => sum + Number(request.amount || 0), 0);
  }

  return res.json({
    success: true,
    analytics: {
      totalUsers,
      totalPets,
      totalRequests,
      revenue,
    },
  });
};

const getUsers = async (req, res) => {
  const users = useMongo()
    ? await User.find().select("-password").sort("-createdAt")
    : (await authDataService.listUsers()).map((user) => ({
        ...user,
        _id: String(user.id || user._id),
      }));

  return res.json({ success: true, users });
};

const deleteUser = async (req, res) => {
  const user = useMongo()
    ? await User.findById(req.params.id)
    : (await authDataService.listUsers()).find((item) => String(item.id) === String(req.params.id));

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user.role === "admin") {
    return res.status(400).json({ success: false, message: "Admin user cannot be deleted" });
  }

  if (useMongo()) {
    await user.deleteOne();
  } else {
    await authDataService.deleteUserById(req.params.id);
  }

  return res.json({ success: true, message: "User deleted" });
};

module.exports = {
  getAnalytics,
  getUsers,
  deleteUser,
};
