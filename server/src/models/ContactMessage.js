const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
