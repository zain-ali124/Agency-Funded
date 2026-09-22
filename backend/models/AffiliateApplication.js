const mongoose = require("mongoose");

const affiliateApplicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: String,
    email: String,
    country: String,
    website: String,
    socialMedia: String,
    tradingCommunity: String,
    promotionMethod: String,
    audienceSize: String,
    additionalInfo: String,
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"], default: "PENDING" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AffiliateApplication", affiliateApplicationSchema);
