const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String },
    country: { type: String },
    address: {
      street: String,
      apartment: String,
      city: String,
      county: String,
      postcode: String,
    },
    role: {
      type: String,
      enum: ["CUSTOMER", "AFFILIATE", "ADMIN", "SUPER_ADMIN", "FINANCE_ADMIN", "TRADING_ADMIN", "CONTENT_ADMIN", "AFFILIATE_ADMIN", "SUPPORT_ADMIN"],
      default: "CUSTOMER",
    },
    emailVerified: { type: Boolean, default: false },
    affiliateStatus: {
      type: String,
      enum: ["NONE", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
      default: "NONE",
    },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED", "BANNED"], default: "ACTIVE" },
    twoFactorEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plain) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
};

module.exports = mongoose.model("User", userSchema);
