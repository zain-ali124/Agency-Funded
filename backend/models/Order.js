const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestEmail: String,

    accountTemplate: { type: mongoose.Schema.Types.ObjectId, ref: "AccountTemplate", required: true },
    accountCategory: { type: mongoose.Schema.Types.ObjectId, ref: "AccountCategory" },
    accountModel: { type: String, enum: ["INSTANT", "ONE_STEP", "THREE_STEP"], required: true },
    accountSize: { type: Number, required: true },

    // immutable price snapshot (see Discount Priority Engine)
    originalPrice: { type: Number, required: true },

    couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
    couponCode: String,
    couponPercentage: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },

    affiliateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    referralCode: String,
    referralPercentage: { type: Number, default: 0 },
    referralDiscount: { type: Number, default: 0 },

    finalPrice: { type: Number, required: true },

    paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentMethod" },
    paymentProof: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentProof", default: null },

    customerDetails: {
      firstName: String,
      lastName: String,
      email: String,
      country: String,
      streetAddress: String,
      apartment: String,
      city: String,
      county: String,
      postcode: String,
      phone: String,
    },

    termsAcceptance: {
      accepted: { type: Boolean, default: false },
      version: String,
      acceptedAt: Date,
      ip: String,
    },

    status: {
      type: String,
      enum: [
        "CREATED", "PAYMENT_PENDING", "PAYMENT_UNDER_REVIEW", "PAYMENT_APPROVED",
        "PAYMENT_REJECTED", "ACCOUNT_CREATING", "ACCOUNT_ACTIVE", "CANCELLED", "COMPLETED",
      ],
      default: "CREATED",
    },

    rejectionReason: String,
    reviewedAt: Date,
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
