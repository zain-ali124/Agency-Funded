const mongoose = require("mongoose");

const affiliateCommissionSchema = new mongoose.Schema(
  {
    affiliate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    originalPrice: { type: Number, required: true },
    commissionPercent: { type: Number, required: true }, // default 40
    commissionAmount: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "PAID", "REJECTED"], default: "PENDING" },
    flaggedForFraud: { type: Boolean, default: false },
    fraudNotes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AffiliateCommission", affiliateCommissionSchema);
