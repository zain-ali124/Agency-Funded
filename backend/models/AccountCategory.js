const mongoose = require("mongoose");

const accountCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Agency Accounts"
    slug: { type: String, required: true, unique: true },
    description: String,
    icon: String,
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccountCategory", accountCategorySchema);
