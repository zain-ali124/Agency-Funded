const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
    startDate: Date,
    expiryDate: Date,
    maxUses: { type: Number, default: null },
    timesUsed: { type: Number, default: 0 },
    minimumOrder: { type: Number, default: 0 },
    applicableCategory: { type: mongoose.Schema.Types.ObjectId, ref: "AccountCategory", default: null },
    applicableModel: { type: String, enum: ["INSTANT", "ONE_STEP", "THREE_STEP", "ALL"], default: "ALL" },
    applicableTemplates: [{ type: mongoose.Schema.Types.ObjectId, ref: "AccountTemplate" }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.methods.isValidForOrder = function ({ orderAmount, templateId, model }) {
  const now = new Date();
  if (!this.active) return { valid: false, reason: "Coupon is not active" };
  if (this.startDate && now < this.startDate) return { valid: false, reason: "Coupon not yet active" };
  if (this.expiryDate && now > this.expiryDate) return { valid: false, reason: "Coupon has expired" };
  if (this.maxUses !== null && this.timesUsed >= this.maxUses) return { valid: false, reason: "Coupon usage limit reached" };
  if (orderAmount < this.minimumOrder) return { valid: false, reason: "Order does not meet minimum amount" };
  if (this.applicableModel !== "ALL" && this.applicableModel !== model) return { valid: false, reason: "Coupon not applicable to this model" };
  if (this.applicableTemplates?.length && !this.applicableTemplates.map(String).includes(String(templateId))) {
    return { valid: false, reason: "Coupon not applicable to this account" };
  }
  return { valid: true };
};

module.exports = mongoose.model("Coupon", couponSchema);
