const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    affiliate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    referralCode: { type: String, required: true },
    visitorId: String, // anonymous click id / cookie id
    clickedAt: { type: Date, default: Date.now },
    registeredUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    converted: { type: Boolean, default: false },
    ip: String,
  },
  { timestamps: true }
);

referralSchema.index({ referralCode: 1, visitorId: 1 });

module.exports = mongoose.model("Referral", referralSchema);
