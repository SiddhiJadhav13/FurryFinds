const mongoose = require("mongoose");

const knowledgePostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        "Pet diseases",
        "Vaccination guides",
        "Medicines and antibiotics",
        "Grooming tips",
        "Pet food guidance",
        "Emergency care",
        "Training tips",
        "General pet care blogs",
      ],
    },
    excerpt: { type: String, default: "" },
    content: { type: String, required: true },
    coverImage: { type: String, default: "" },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("KnowledgePost", knowledgePostSchema);
