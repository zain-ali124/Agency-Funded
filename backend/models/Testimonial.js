const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    customerName: String,
    country: String,
    accountSize: Number,
    model: String,
    testimonial: String,
    rating: { type: Number, min: 1, max: 5, default: 5 },
    avatarUrl: String,
    verified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
