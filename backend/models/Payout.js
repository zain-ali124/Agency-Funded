const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    eligibleProfit: { type: Number, required: true },
    profitSplitPercent: { type: Number, required: true },
    payoutAmount: { type: Number, required: true },
    paymentMethod: String,
    paymentAddress: String,
    status: {
      type: String,
      enum: ["NOT_ELIGIBLE", "ELIGIBLE", "PENDING", "UNDER_REVIEW", "APPROVED", "PROCESSING", "PAID", "REJECTED", "CANCELLED"],
      default: "PENDING",
    },
    requestedAt: { type: Date, default: Date.now },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt: Date,
    transactionReference: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payout", payoutSchema);
