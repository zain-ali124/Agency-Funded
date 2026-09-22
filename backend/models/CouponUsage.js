const mongoose = require("mongoose");

const couponUsageSchema = new mongoose.Schema(
  {
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    discountAmount: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("CouponUsage", couponUsageSchema);
