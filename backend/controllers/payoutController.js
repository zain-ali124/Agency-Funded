const asyncHandler = require("../middleware/asyncHandler");
const Payout = require("../models/Payout");
const Account = require("../models/Account");
const { profitShare } = require("../utils/formulaEngine");
const { sendEmail, templates } = require("../utils/sendEmail");

// @route POST /api/payouts/request
const requestPayout = asyncHandler(async (req, res) => {
  const { accountId, paymentMethod, paymentAddress } = req.body;
  const account = await Account.findById(accountId);
  if (!account || String(account.user) !== String(req.user._id)) {
    res.status(404);
    throw new Error("Account not found");
  }
  if (!["FUNDED", "PAYOUT_ELIGIBLE"].includes(account.status)) {
    res.status(400);
    throw new Error("Account is not eligible for payout");
  }
  const rules = account.getEffectiveRules();
  const splitPercent = rules.profitSplitDefault || 80;
  const payoutAmount = profitShare(account.profit, splitPercent);

  const payout = await Payout.create({
    user: req.user._id,
    account: account._id,
    eligibleProfit: account.profit,
    profitSplitPercent: splitPercent,
    payoutAmount,
    paymentMethod,
    paymentAddress,
    status: "PENDING",
  });

  account.payoutStatus = "PENDING";
  await account.save();

  res.status(201).json({ success: true, payout });
});

// @route GET /api/payouts/mine
const getMyPayouts = asyncHandler(async (req, res) => {
  const payouts = await Payout.find({ user: req.user._id }).populate("account", "accountNumber model accountSize").sort({ createdAt: -1 });
  res.json({ success: true, payouts });
});

// ===== ADMIN =====

const adminListPayouts = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const payouts = await Payout.find(filter)
    .populate("user", "firstName lastName email")
    .populate("account", "accountNumber model accountSize")
    .sort({ createdAt: -1 });
  res.json({ success: true, payouts });
});

const adminProcessPayout = asyncHandler(async (req, res) => {
  const { status, transactionReference } = req.body;
  const payout = await Payout.findById(req.params.id).populate("user").populate("account");
  if (!payout) {
    res.status(404);
    throw new Error("Payout not found");
  }
  payout.status = status;
  payout.transactionReference = transactionReference;
  payout.processedBy = req.user._id;
  payout.processedAt = new Date();
  await payout.save();

  if (status === "PAID") {
    const account = await Account.findById(payout.account._id);
    account.payoutStatus = "PAID";
    account.loss = 0; // simplistic post-payout reset placeholder; real cycles are business-defined
    await account.save();
    const t = templates.payoutPaid(payout.user.firstName, payout.payoutAmount);
    await sendEmail({ to: payout.user.email, ...t });
  }

  res.json({ success: true, payout });
});

module.exports = { requestPayout, getMyPayouts, adminListPayouts, adminProcessPayout };
