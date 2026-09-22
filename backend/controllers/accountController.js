const asyncHandler = require("../middleware/asyncHandler");
const Account = require("../models/Account");
const AuditLog = require("../models/AuditLog");
const {
  profitTarget, maxOverallLossAmount, dailyLossAmount, dailyLossThreshold, staticDrawdownFloor,
} = require("../utils/formulaEngine");

// Derive live metrics for a dashboard view using the account's effective (snapshot + override) rules
function deriveMetrics(account) {
  const rules = account.getEffectiveRules();
  const target = profitTarget(account.startingBalance, rules.profitTargetPercent || 0);
  const maxLoss = maxOverallLossAmount(account.startingBalance, rules.maxOverallLossPercent || 0);
  const dailyLoss = dailyLossAmount(account.startingBalance, rules.maxDailyLossPercent || 0);
  const breachLevel = staticDrawdownFloor(account.startingBalance, maxLoss);

  return {
    profitTargetAmount: target,
    maxOverallLossAmount: maxLoss,
    maxDailyLossAmount: dailyLoss,
    breachLevel,
    remainingOverallLoss: Math.max(0, maxLoss - account.loss),
    remainingToTarget: Math.max(0, target - account.profit),
    tradingDaysProgress: `${account.tradingDays}/${rules.minTradingDays || 0}`,
    rules,
  };
}

// @route GET /api/accounts/mine
const getMyAccounts = asyncHandler(async (req, res) => {
  const accounts = await Account.find({ user: req.user._id }).populate("template").sort({ createdAt: -1 });
  const withMetrics = accounts.map((a) => ({ ...a.toObject(), metrics: deriveMetrics(a) }));
  res.json({ success: true, accounts: withMetrics });
});

// @route GET /api/accounts/:id
const getAccount = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id).populate("template");
  if (!account) {
    res.status(404);
    throw new Error("Account not found");
  }
  if (String(account.user) !== String(req.user._id) && !req.user.role.includes("ADMIN")) {
    res.status(403);
    throw new Error("Not authorized to view this account");
  }
  res.json({ success: true, account, metrics: deriveMetrics(account) });
});

// ===== ADMIN: per-account trading-statistics editor (PRD Section 50/67) =====

const adminListAccounts = asyncHandler(async (req, res) => {
  const { status, model } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (model) filter.model = model.toUpperCase();
  const accounts = await Account.find(filter).populate("template").populate("user", "firstName lastName email").sort({ createdAt: -1 });
  res.json({ success: true, accounts });
});

const adminUpdateAccountStats = asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id);
  if (!account) {
    res.status(404);
    throw new Error("Account not found");
  }
  const editableFields = [
    "currentBalance", "currentEquity", "profit", "loss", "tradingDays",
    "status", "currentPhase", "payoutStatus", "nextPayoutDate", "credentialStatus", "tradingUsername",
  ];
  const oldValue = {};
  const newValue = {};
  for (const field of editableFields) {
    if (req.body[field] !== undefined) {
      oldValue[field] = account[field];
      account[field] = req.body[field];
      newValue[field] = req.body[field];
    }
  }
  await account.save();

  await AuditLog.create({
    admin: req.user._id,
    action: "ADMIN_UPDATE_ACCOUNT_STATS",
    targetType: "Account",
    targetId: account._id,
    oldValue,
    newValue,
    reason: req.body.reason,
  });

  res.json({ success: true, account });
});

// Per-account override of a global rule (PRD Section 51/113)
const adminOverrideAccountRule = asyncHandler(async (req, res) => {
  const { field, value, reason } = req.body;
  const account = await Account.findById(req.params.id);
  if (!account) {
    res.status(404);
    throw new Error("Account not found");
  }
  const oldValue = account.overrides?.[field];
  account.overrides = { ...(account.overrides || {}), [field]: value };
  await account.save();

  await AuditLog.create({
    admin: req.user._id,
    action: "ADMIN_OVERRIDE_ACCOUNT_RULE",
    targetType: "Account",
    targetId: account._id,
    oldValue: { [field]: oldValue },
    newValue: { [field]: value },
    reason,
  });

  res.json({ success: true, account });
});

module.exports = { getMyAccounts, getAccount, adminListAccounts, adminUpdateAccountStats, adminOverrideAccountRule, deriveMetrics };
