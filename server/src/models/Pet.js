const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Dogs", "Cats", "Birds", "Fish", "Rabbits", "Others"],
    },
    breed: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0 },
    gender: { type: String, required: true, enum: ["Male", "Female"] },
    price: { type: Number, required: true, min: 0 },
    vaccinationStatus: { type: String, default: "Not updated" },
    antibioticsHistory: { type: String, default: "Not updated" },
    diseases: { type: String, default: "None reported" },
    healthCondition: { type: String, default: "Healthy" },
    description: { type: String, default: "" },
    images: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pet", petSchema);
