const asyncHandler = require("../middleware/asyncHandler");
const Coupon = require("../models/Coupon");
const CouponUsage = require("../models/CouponUsage");

const adminListCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});

const adminCreateCoupon = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.code) body.code = body.code.toUpperCase();
  const coupon = await Coupon.create(body);
  res.status(201).json({ success: true, coupon });
});

const adminUpdateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  res.json({ success: true, coupon });
});

const adminCouponAnalytics = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  const usages = await CouponUsage.find({ coupon: coupon._id }).populate("order", "finalPrice orderId");
  const totalDiscountGiven = usages.reduce((sum, u) => sum + (u.discountAmount || 0), 0);
  res.json({ success: true, coupon, usesCount: usages.length, totalDiscountGiven, usages });
});

// PUBLIC: validate coupon code (lightweight check used at checkout before full quote)
const validateCoupon = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) {
    return res.json({ success: true, valid: false, reason: "Coupon not found" });
  }
  res.json({ success: true, valid: coupon.active, discountPercent: coupon.discountPercent });
});

module.exports = { adminListCoupons, adminCreateCoupon, adminUpdateCoupon, adminCouponAnalytics, validateCoupon };
