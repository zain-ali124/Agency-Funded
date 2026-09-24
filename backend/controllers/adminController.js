const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");
const Account = require("../models/Account");
const Order = require("../models/Order");
const AffiliateCommission = require("../models/AffiliateCommission");
const AffiliateWithdrawal = require("../models/AffiliateWithdrawal");
const Payout = require("../models/Payout");
const AuditLog = require("../models/AuditLog");

// @route GET /api/admin/dashboard  (PRD Section 64)
const getDashboardMetrics = asyncHandler(async (req, res) => {
  const [totalUsers, activeAccounts, pendingOrders, paymentReviews, approvedOrders, failedAccounts] = await Promise.all([
    User.countDocuments(),
    Account.countDocuments({ status: { $in: ["ACTIVE", "FUNDED", "EVALUATION", "PHASE_1", "PHASE_2", "PHASE_3"] } }),
    Order.countDocuments({ status: "PAYMENT_PENDING" }),
    Order.countDocuments({ status: "PAYMENT_UNDER_REVIEW" }),
    Order.countDocuments({ status: "ACCOUNT_ACTIVE" }),
    Account.countDocuments({ status: "FAILED" }),
  ]);

  const revenueAgg = await Order.aggregate([
    { $match: { status: "ACCOUNT_ACTIVE" } },
    { $group: { _id: null, total: { $sum: "$finalPrice" } } },
  ]);
  const revenue = revenueAgg[0]?.total || 0;

  const affiliateCommissionAgg = await AffiliateCommission.aggregate([
    { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
  ]);
  const affiliateCommissionTotal = affiliateCommissionAgg[0]?.total || 0;

  const pendingWithdrawals = await AffiliateWithdrawal.countDocuments({ status: { $in: ["PENDING", "UNDER_REVIEW"] } });
  const pendingPayouts = await Payout.countDocuments({ status: { $in: ["PENDING", "UNDER_REVIEW"] } });

  res.json({
    success: true,
    metrics: {
      totalUsers,
      activeAccounts,
      pendingOrders,
      paymentReviews,
      approvedOrders,
      revenue,
      affiliateCommissionTotal,
      pendingWithdrawals,
      customerPayoutsPending: pendingPayouts,
      failedAccounts,
    },
  });
});

// @route GET /api/admin/audit-logs
const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find().populate("admin", "firstName lastName email").sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, logs });
});

// @route GET /api/admin/users
const adminListUsers = asyncHandler(async (req, res) => {
  const { search, status, affiliateStatus } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (affiliateStatus) filter.affiliateStatus = affiliateStatus;
  if (search) {
    filter.$or = [
      { firstName: new RegExp(search, "i") },
      { lastName: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
    ];
  }
  const users = await User.find(filter)
    .populate("referredBy", "firstName lastName email")
    .select("-passwordHash")
    .sort({ createdAt: -1 });

  const normalizedUsers = users.map((user) => {
    const referredBy = user.referredBy;
    const referredByName = referredBy
      ? `${referredBy.firstName || ""} ${referredBy.lastName || ""}`.trim() || referredBy.email || "Unknown affiliate"
      : "—";

    return {
      ...user.toObject(),
      referredBy: referredByName,
      referredById: referredBy?._id || null,
    };
  });

  res.json({ success: true, users: normalizedUsers });
});

// @route PUT /api/admin/users/:id/role  (SUPER_ADMIN only, enforced in routes)
const adminUpdateUserRole = asyncHandler(async (req, res) => {
  const { role, status } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const oldValue = { role: user.role, status: user.status };
  if (role) user.role = role;
  if (status) user.status = status;
  await user.save();

  await AuditLog.create({
    admin: req.user._id,
    action: "ADMIN_UPDATE_USER",
    targetType: "User",
    targetId: user._id,
    oldValue,
    newValue: { role: user.role, status: user.status },
  });

  res.json({ success: true, user });
});

module.exports = { getDashboardMetrics, getAuditLogs, adminListUsers, adminUpdateUserRole };
