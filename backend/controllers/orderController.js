const asyncHandler = require("../middleware/asyncHandler");
const Order = require("../models/Order");
const AccountTemplate = require("../models/AccountTemplate");
const Coupon = require("../models/Coupon");
const CouponUsage = require("../models/CouponUsage");
const PaymentProof = require("../models/PaymentProof");
const Account = require("../models/Account");
const Referral = require("../models/Referral");
const AffiliateCommission = require("../models/AffiliateCommission");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { generateOrderId, generateAccountNumber } = require("../utils/generateIds");
const { computeOrderPricing, computeAffiliateCommission } = require("../utils/formulaEngine");
const { sendEmail, templates } = require("../utils/sendEmail");
const generateToken = require("../utils/generateToken");

const REFERRAL_ATTRIBUTION_DAYS = Number(process.env.REFERRAL_ATTRIBUTION_DAYS || 30);

// @route POST /api/orders/quote  — price preview before checkout (no DB write)
const quoteOrder = asyncHandler(async (req, res) => {
  const { templateId, couponCode, referralCode } = req.body;
  const template = await AccountTemplate.findById(templateId);
  if (!template || !template.active) {
    res.status(404);
    throw new Error("Account template not found or inactive");
  }
  const originalPrice = template.salePrice ?? template.originalPrice;

  let hasApprovedReferral = false;
  let resolvedAffiliate = null;
  const registeredAffiliate = req.user?.referredBy
    ? await User.findOne({ _id: req.user.referredBy, affiliateStatus: "APPROVED" })
    : null;
  if (referralCode) {
    resolvedAffiliate = await User.findOne({ referralCode: referralCode.toUpperCase(), affiliateStatus: "APPROVED" });
    resolvedAffiliate = resolvedAffiliate || registeredAffiliate;
    hasApprovedReferral = !!resolvedAffiliate;
  } else if (registeredAffiliate) {
    resolvedAffiliate = registeredAffiliate;
    hasApprovedReferral = true;
  }

  let couponPercent = 0;
  let couponError = null;
  if (couponCode && !hasApprovedReferral) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) couponError = "Coupon not found";
    else {
      const check = coupon.isValidForOrder({ orderAmount: originalPrice, templateId, model: template.model });
      if (!check.valid) couponError = check.reason;
      else couponPercent = coupon.discountPercent;
    }
  } else if (couponCode && hasApprovedReferral) {
    couponError = "Referral discount is active. Promotional coupons cannot be combined with referral discounts.";
  }

  const pricing = computeOrderPricing({ originalPrice, hasApprovedReferral, couponPercent });

  res.json({ success: true, pricing, couponError, affiliateApplied: !!resolvedAffiliate });
});

// @route POST /api/orders  — create order (guest or logged-in)
const createOrder = asyncHandler(async (req, res) => {
  const { templateId, couponCode, referralCode, paymentMethodId, customerDetails, guestEmail, password, termsAccepted, termsVersion } = req.body;

  if (!termsAccepted) {
    res.status(400);
    throw new Error("You must accept the Terms & Conditions, trading rules, payout policy and risk disclosure");
  }

  const template = await AccountTemplate.findById(templateId).populate("category");
  if (!template || !template.active) {
    res.status(404);
    throw new Error("Account template not found or inactive");
  }

  let checkoutUser = req.user;
  let createdUserToken = null;
  const checkoutEmail = (req.user ? req.user.email : guestEmail || customerDetails?.email)?.trim().toLowerCase();

  if (!checkoutUser) {
    if (!checkoutEmail || !password) {
      res.status(400);
      throw new Error("Email and password are required to create your customer account");
    }
    if (password.length < 8) {
      res.status(400);
      throw new Error("Password must be at least 8 characters");
    }

    const existingUser = await User.findOne({ email: checkoutEmail });
    if (existingUser) {
      res.status(409);
      throw new Error("An account with this email already exists. Please log in before checking out.");
    }

    checkoutUser = await User.create({
      firstName: customerDetails?.firstName,
      lastName: customerDetails?.lastName,
      email: checkoutEmail,
      passwordHash: await User.hashPassword(password),
      phone: customerDetails?.phone,
      country: customerDetails?.country,
      address: {
        street: customerDetails?.streetAddress,
        apartment: customerDetails?.apartment,
        city: customerDetails?.city,
        county: customerDetails?.county,
        postcode: customerDetails?.postcode,
      },
    });
    createdUserToken = generateToken(checkoutUser._id, checkoutUser.role);
  }

  const orderCustomerDetails = { ...customerDetails, email: checkoutUser.email };
  const originalPrice = template.salePrice ?? template.originalPrice;

  // Discount Priority Engine: referral beats coupon, never stack (PRD 110/36)
  let hasApprovedReferral = false;
  let resolvedAffiliate = null;
  const registeredAffiliate = req.user?.referredBy
    ? await User.findOne({ _id: req.user.referredBy, affiliateStatus: "APPROVED" })
    : null;
  if (referralCode) {
    resolvedAffiliate = await User.findOne({ referralCode: referralCode.toUpperCase(), affiliateStatus: "APPROVED" });
    resolvedAffiliate = resolvedAffiliate || registeredAffiliate;
    hasApprovedReferral = !!resolvedAffiliate;
  } else if (registeredAffiliate) {
    resolvedAffiliate = registeredAffiliate;
    hasApprovedReferral = true;
  }

  let couponPercent = 0;
  let coupon = null;
  if (couponCode && !hasApprovedReferral) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (coupon) {
      const check = coupon.isValidForOrder({ orderAmount: originalPrice, templateId, model: template.model });
      if (check.valid) couponPercent = coupon.discountPercent;
      else coupon = null;
    }
  }

  const pricing = computeOrderPricing({ originalPrice, hasApprovedReferral, couponPercent });

  const order = await Order.create({
    orderId: generateOrderId(),
    user: checkoutUser._id,
    guestEmail: undefined,
    accountTemplate: template._id,
    accountCategory: template.category?._id,
    accountModel: template.model,
    accountSize: template.accountSize,
    originalPrice: pricing.originalPrice,
    couponId: coupon?._id || null,
    couponCode: coupon?.code,
    couponPercentage: pricing.couponPercentage,
    couponDiscount: pricing.couponDiscount,
    affiliateId: resolvedAffiliate?._id || null,
    referralCode: resolvedAffiliate ? (referralCode || resolvedAffiliate.referralCode).toUpperCase() : undefined,
    referralPercentage: pricing.referralPercentage,
    referralDiscount: pricing.referralDiscount,
    finalPrice: pricing.finalPrice,
    paymentMethod: paymentMethodId || undefined,
    customerDetails: orderCustomerDetails,
    termsAcceptance: {
      accepted: true,
      version: termsVersion || "v1",
      acceptedAt: new Date(),
      ip: req.ip,
    },
    status: "PAYMENT_PENDING",
  });

  if (coupon) {
    coupon.timesUsed += 1;
    await coupon.save();
    await CouponUsage.create({ coupon: coupon._id, user: checkoutUser._id, order: order._id, discountAmount: pricing.couponDiscount });
  }

  if (resolvedAffiliate) {
    await Referral.findOneAndUpdate(
      {
        affiliate: resolvedAffiliate._id,
        referralCode: resolvedAffiliate.referralCode,
        order: null,
        converted: false,
        $or: [
          { registeredUser: checkoutUser._id },
          { registeredUser: null },
        ],
        createdAt: { $gte: new Date(Date.now() - REFERRAL_ATTRIBUTION_DAYS * 86400000) },
      },
      { order: order._id, converted: true, registeredUser: checkoutUser._id },
      { sort: { createdAt: -1 } }
    );
  }

  const emailTo = order.customerDetails?.email || order.guestEmail;
  if (emailTo) {
    const t = templates.orderReceived(order.customerDetails?.firstName || "there", order.orderId);
    await sendEmail({ to: emailTo, ...t });
  }

  res.status(201).json({
    success: true,
    order,
    token: createdUserToken,
    user: createdUserToken ? {
      id: checkoutUser._id,
      firstName: checkoutUser.firstName,
      lastName: checkoutUser.lastName,
      email: checkoutUser.email,
      role: checkoutUser.role,
    } : undefined,
  });
});

// @route GET /api/orders/:orderId
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId })
    .populate("accountTemplate")
    .populate("paymentMethod")
    .populate("paymentProof");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  res.json({ success: true, order });
});

// @route GET /api/orders/mine
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate("accountTemplate").sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// @route POST /api/orders/:orderId/payment-proof  (multipart)
const uploadPaymentProof = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId });
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const proof = await PaymentProof.create({
    order: order._id,
    fileUrl: `/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    uploadedBy: req.user?._id,
  });

  order.paymentProof = proof._id;
  order.status = "PAYMENT_UNDER_REVIEW";
  order.reviewedAt = new Date();
  await order.save();

  const emailTo = order.customerDetails?.email || order.guestEmail;
  if (emailTo) {
    const t = templates.paymentUnderReview(order.customerDetails?.firstName || "there");
    await sendEmail({ to: emailTo, ...t });
  }

  res.status(201).json({ success: true, order, proof });
});

// ===== ADMIN =====

// @route GET /api/admin/orders
const adminListOrders = asyncHandler(async (req, res) => {
  const { status, model, country } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (model) filter.accountModel = model.toUpperCase();
  if (country) filter["customerDetails.country"] = country;

  const orders = await Order.find(filter)
    .populate("accountTemplate")
    .populate("paymentProof")
    .populate("user", "firstName lastName email")
    .sort({ createdAt: -1 });

  res.json({ success: true, orders });
});

// @route PUT /api/admin/orders/:orderId/approve
const adminApproveOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId }).populate("accountTemplate");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.status === "ACCOUNT_ACTIVE") {
    res.status(400);
    throw new Error("Order already approved and activated");
  }

  order.status = "PAYMENT_APPROVED";
  order.approvedAt = new Date();
  order.approvedBy = req.user._id;
  await order.save();

  const template = order.accountTemplate;

  // Build immutable rule snapshot (PRD Section 52)
  const ruleSnapshot = {
    tradingPeriod: template.tradingPeriod,
    minTradingDays: template.minTradingDays,
    minDailyProfitPercent: template.minDailyProfitPercent,
    profitTargetPercent: template.profitTargetPercent,
    profitTargetPerPhasePercent: template.profitTargetPerPhasePercent,
    maxOverallLossPercent: template.maxOverallLossPercent,
    overallLossType: template.overallLossType,
    maxDailyLossPercent: template.maxDailyLossPercent,
    dailyLossType: template.dailyLossType,
    eaAllowed: template.eaAllowed,
    botsAllowed: template.botsAllowed,
    copyTradingAllowed: template.copyTradingAllowed,
    newsTrading: template.newsTrading,
    weekendTrading: template.weekendTrading,
    consistencyRulePercent: template.consistencyRulePercent,
    profitSplitDefault: template.profitSplitDefault,
    profitSplitMaximum: template.profitSplitMaximum,
    refundable: template.refundable,
    refundAfterPayoutNumber: template.refundAfterPayoutNumber,
    payoutFirstDays: template.payoutFirstDays,
    payoutRecurringDays: template.payoutRecurringDays,
    leverage: template.leverage,
    phases: template.phases,
    purchasedAt: new Date(),
  };

  const account = await Account.create({
    user: order.user,
    template: template._id,
    order: order._id,
    accountNumber: generateAccountNumber(),
    model: order.accountModel,
    accountSize: order.accountSize,
    startingBalance: order.accountSize,
    currentBalance: order.accountSize,
    currentEquity: order.accountSize,
    ruleSnapshot,
    status: template.model === "INSTANT" ? "FUNDED" : "EVALUATION",
    currentPhase: 1,
  });

  order.status = "ACCOUNT_ACTIVE";
  await order.save();

  // Affiliate commission (PRD Section 35, calculated on ORIGINAL price)
  if (order.affiliateId) {
    const commissionAmount = computeAffiliateCommission(order.originalPrice);
    const commission = await AffiliateCommission.create({
      affiliate: order.affiliateId,
      order: order._id,
      originalPrice: order.originalPrice,
      commissionPercent: 40,
      commissionAmount,
      status: "PENDING",
    });
    const affiliateUser = await User.findById(order.affiliateId);
    if (affiliateUser) {
      const t = templates.commissionReceived(affiliateUser.firstName, commissionAmount);
      await sendEmail({ to: affiliateUser.email, ...t });
    }
  }

  await AuditLog.create({
    admin: req.user._id,
    action: "APPROVE_ORDER_AND_ACTIVATE_ACCOUNT",
    targetType: "Order",
    targetId: order._id,
    newValue: { accountId: account._id, accountNumber: account.accountNumber },
  });

  const emailTo = order.customerDetails?.email || order.guestEmail;
  if (emailTo) {
    const t = templates.accountActivated(order.customerDetails?.firstName || "there", account);
    await sendEmail({ to: emailTo, ...t });
  }

  res.json({ success: true, order, account });
});

// @route PUT /api/admin/orders/:orderId/reject
const adminRejectOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findOne({ orderId: req.params.orderId });
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  order.status = "PAYMENT_REJECTED";
  order.rejectionReason = reason;
  order.reviewedAt = new Date();
  await order.save();

  await AuditLog.create({
    admin: req.user._id,
    action: "REJECT_ORDER",
    targetType: "Order",
    targetId: order._id,
    reason,
  });

  const emailTo = order.customerDetails?.email || order.guestEmail;
  if (emailTo) {
    const t = templates.paymentRejected(order.customerDetails?.firstName || "there", reason);
    await sendEmail({ to: emailTo, ...t });
  }

  res.json({ success: true, order });
});

module.exports = {
  quoteOrder,
  createOrder,
  getOrder,
  getMyOrders,
  uploadPaymentProof,
  adminListOrders,
  adminApproveOrder,
  adminRejectOrder,
};
