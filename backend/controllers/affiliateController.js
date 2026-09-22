const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");
const AffiliateApplication = require("../models/AffiliateApplication");
const Referral = require("../models/Referral");
const AffiliateCommission = require("../models/AffiliateCommission");
const AffiliateWithdrawal = require("../models/AffiliateWithdrawal");
const { generateReferralCode } = require("../utils/generateIds");
const { sendEmail, templates } = require("../utils/sendEmail");

// @route POST /api/affiliate/apply
const applyForAffiliate = asyncHandler(async (req, res) => {
  const existing = await AffiliateApplication.findOne({ user: req.user._id, status: { $in: ["PENDING", "APPROVED"] } });
  if (existing) {
    res.status(400);
    throw new Error("You already have a pending or approved affiliate application");
  }

  const application = await AffiliateApplication.create({
    user: req.user._id,
    fullName: `${req.user.firstName} ${req.user.lastName}`,
    email: req.user.email,
    ...req.body,
  });

  await User.findByIdAndUpdate(req.user._id, { affiliateStatus: "PENDING" });

  const t = templates.affiliateApplicationReceived(req.user.firstName);
  await sendEmail({ to: req.user.email, ...t });

  res.status(201).json({ success: true, application });
});

// @route GET /api/affiliate/track/:code  — records a referral click (called by frontend on landing)
const trackClick = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const { visitorId } = req.body;
  const affiliate = await User.findOne({ referralCode: code.toUpperCase(), affiliateStatus: "APPROVED" });
  if (!affiliate) {
    return res.json({ success: true, tracked: false });
  }
  await Referral.create({
    affiliate: affiliate._id,
    referralCode: code.toUpperCase(),
    visitorId,
    ip: req.ip,
  });
  res.json({ success: true, tracked: true });
});

// @route GET /api/affiliate/dashboard
const getAffiliateDashboard = asyncHandler(async (req, res) => {
  if (req.user.affiliateStatus !== "APPROVED") {
    res.status(403);
    throw new Error("You are not an approved affiliate");
  }

  const [clicks, referrals, registeredUsers, commissions, withdrawals] = await Promise.all([
    Referral.countDocuments({ affiliate: req.user._id }),
    Referral.countDocuments({ affiliate: req.user._id, registeredUser: { $ne: null } }),
    User.countDocuments({ referredBy: req.user._id }),
    AffiliateCommission.find({ affiliate: req.user._id }).populate("order", "orderId accountSize accountModel"),
    AffiliateWithdrawal.find({ affiliate: req.user._id }).sort({ createdAt: -1 }),
  ]);

  const totalCommission = commissions.reduce((s, c) => s + c.commissionAmount, 0);
  const pendingCommission = commissions.filter((c) => c.status === "PENDING").reduce((s, c) => s + c.commissionAmount, 0);
  const paidCommission = commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + c.commissionAmount, 0);
  const withdrawnTotal = withdrawals.filter((w) => w.status === "PAID").reduce((s, w) => s + w.amount, 0);
  const approvedOrders = commissions.length;
  const availableBalance = commissions
    .filter((c) => ["PENDING", "APPROVED", "PAID"].includes(c.status))
    .reduce((s, c) => s + c.commissionAmount, 0) - withdrawnTotal;

  res.json({
    success: true,
    referralCode: req.user.referralCode,
    referralLink: `${process.env.CLIENT_URL}/?ref=${req.user.referralCode}`,
    stats: {
      totalClicks: clicks,
      registeredReferrals: Math.max(referrals, registeredUsers),
      successfulOrders: approvedOrders,
      totalCommission,
      pendingCommission,
      availableBalance: Math.max(0, availableBalance),
      withdrawnTotal,
    },
    commissions,
    withdrawals,
  });
});

// @route POST /api/affiliate/withdraw
const requestWithdrawal = asyncHandler(async (req, res) => {
  if (req.user.affiliateStatus !== "APPROVED") {
    res.status(403);
    throw new Error("You are not an approved affiliate");
  }
  const { amount, paymentMethod, paymentAddress, additionalInfo } = req.body;
  const withdrawalAmount = Number(amount);
  if (!Number.isFinite(withdrawalAmount) || withdrawalAmount <= 0) {
    res.status(400);
    throw new Error("Withdrawal amount must be greater than zero");
  }

  const commissions = await AffiliateCommission.find({ affiliate: req.user._id, status: { $in: ["PENDING", "APPROVED", "PAID"] } });
  const withdrawals = await AffiliateWithdrawal.find({ affiliate: req.user._id, status: { $in: ["PENDING", "UNDER_REVIEW", "APPROVED", "PROCESSING", "PAID"] } });
  const availableBalance = commissions.reduce((sum, commission) => sum + commission.commissionAmount, 0)
    - withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
  if (withdrawalAmount > availableBalance) {
    res.status(400);
    throw new Error(`Withdrawal amount exceeds your available balance of $${Math.max(0, availableBalance).toFixed(2)}`);
  }

  const withdrawal = await AffiliateWithdrawal.create({
    affiliate: req.user._id,
    amount: withdrawalAmount,
    paymentMethod,
    paymentAddress,
    additionalInfo,
  });
  res.status(201).json({ success: true, withdrawal });
});

// @route GET /api/affiliate/admin/users
const adminListAffiliateUsers = asyncHandler(async (req, res) => {
  const affiliates = await User.find({ affiliateStatus: "APPROVED" })
    .select("firstName lastName email referralCode createdAt")
    .sort({ createdAt: -1 });

  const users = await Promise.all(affiliates.map(async (affiliate) => {
    const [referrals, registeredUsers, commissions, withdrawals] = await Promise.all([
      Referral.find({ affiliate: affiliate._id, registeredUser: { $ne: null } })
        .populate("registeredUser", "firstName lastName email createdAt")
        .sort({ createdAt: -1 }),
      User.find({ referredBy: affiliate._id })
        .select("firstName lastName email createdAt")
        .sort({ createdAt: -1 }),
      AffiliateCommission.find({ affiliate: affiliate._id }),
      AffiliateWithdrawal.find({ affiliate: affiliate._id }),
    ]);
    const referralUserIds = new Set(referrals.map((referral) => String(referral.registeredUser?._id)));
    const mergedReferrals = [
      ...referrals,
      ...registeredUsers
        .filter((user) => !referralUserIds.has(String(user._id)))
        .map((user) => ({
          _id: `user-${user._id}`,
          registeredUser: user,
          createdAt: user.createdAt,
        })),
    ];
    const earned = commissions
      .filter((commission) => commission.status !== "REJECTED")
      .reduce((sum, commission) => sum + commission.commissionAmount, 0);
    const withdrawn = withdrawals
      .filter((item) => ["PENDING", "UNDER_REVIEW", "APPROVED", "PROCESSING", "PAID"].includes(item.status))
      .reduce((sum, item) => sum + item.amount, 0);
    return {
      affiliate,
      referrals: mergedReferrals,
      earnings: {
        total: earned,
        pending: commissions.filter((item) => item.status === "PENDING").reduce((sum, item) => sum + item.commissionAmount, 0),
        available: Math.max(0, earned - withdrawn),
        withdrawn,
      },
    };
  }));

  res.json({ success: true, users });
});

// ===== ADMIN =====

const adminListApplications = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const applications = await AffiliateApplication.find(filter).populate("user", "firstName lastName email").sort({ createdAt: -1 });
  res.json({ success: true, applications });
});

const adminReviewApplication = asyncHandler(async (req, res) => {
  const { decision } = req.body; // APPROVED | REJECTED
  const application = await AffiliateApplication.findById(req.params.id).populate("user");
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }
  application.status = decision;
  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  await application.save();

  if (decision === "APPROVED") {
    let referralCode = generateReferralCode(application.user.firstName);
    // ensure uniqueness
    while (await User.findOne({ referralCode })) referralCode = generateReferralCode(application.user.firstName);
    await User.findByIdAndUpdate(application.user._id, { affiliateStatus: "APPROVED", referralCode, role: "AFFILIATE" });

    const t = templates.affiliateApproved(application.user.firstName, referralCode);
    await sendEmail({ to: application.user.email, ...t });
  } else {
    await User.findByIdAndUpdate(application.user._id, { affiliateStatus: "REJECTED" });
  }

  res.json({ success: true, application });
});

const adminListCommissions = asyncHandler(async (req, res) => {
  const commissions = await AffiliateCommission.find().populate("affiliate", "firstName lastName email").populate("order", "orderId").sort({ createdAt: -1 });
  res.json({ success: true, commissions });
});

const adminUpdateCommissionStatus = asyncHandler(async (req, res) => {
  const { status, fraudNotes } = req.body;
  const commission = await AffiliateCommission.findByIdAndUpdate(
    req.params.id,
    { status, fraudNotes, flaggedForFraud: status === "REJECTED" && !!fraudNotes },
    { new: true }
  );
  if (!commission) {
    res.status(404);
    throw new Error("Commission not found");
  }
  res.json({ success: true, commission });
});

const adminListWithdrawals = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const withdrawals = await AffiliateWithdrawal.find(filter).populate("affiliate", "firstName lastName email").sort({ createdAt: -1 });
  res.json({ success: true, withdrawals });
});

const adminProcessWithdrawal = asyncHandler(async (req, res) => {
  const { status, transactionReference } = req.body;
  const withdrawal = await AffiliateWithdrawal.findById(req.params.id).populate("affiliate");
  if (!withdrawal) {
    res.status(404);
    throw new Error("Withdrawal not found");
  }
  withdrawal.status = status;
  withdrawal.transactionReference = transactionReference;
  withdrawal.processedBy = req.user._id;
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  if (status === "PAID") {
    const t = templates.payoutPaid(withdrawal.affiliate.firstName, withdrawal.amount);
    await sendEmail({ to: withdrawal.affiliate.email, ...t });
  }

  res.json({ success: true, withdrawal });
});

module.exports = {
  applyForAffiliate,
  trackClick,
  getAffiliateDashboard,
  requestWithdrawal,
  adminListAffiliateUsers,
  adminListApplications,
  adminReviewApplication,
  adminListCommissions,
  adminUpdateCommissionStatus,
  adminListWithdrawals,
  adminProcessWithdrawal,
};
