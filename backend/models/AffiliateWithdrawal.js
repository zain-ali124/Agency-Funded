const mongoose = require("mongoose");

const affiliateWithdrawalSchema = new mongoose.Schema(
  {
    affiliate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    paymentMethod: String,
    paymentAddress: String,
    additionalInfo: String,
    status: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "PROCESSING", "PAID", "REJECTED"],
      default: "PENDING",
    },
    transactionReference: String,
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AffiliateWithdrawal", affiliateWithdrawalSchema);
