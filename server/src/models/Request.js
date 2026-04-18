const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },
    requestType: { type: String, enum: ["buy", "adopt"], required: true },
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    amount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
