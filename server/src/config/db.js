const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    // eslint-disable-next-line no-console
    console.warn("MONGODB_URI not set. Skipping MongoDB connection.");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // eslint-disable-next-line no-console
    console.log("MongoDB connected successfully");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
