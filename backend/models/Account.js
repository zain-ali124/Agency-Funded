const mongoose = require("mongoose");

// A CUSTOMER'S purchased/active trading account. Rules are SNAPSHOTTED from
// the AccountTemplate at purchase time, plus optional per-account admin overrides.
const accountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    template: { type: mongoose.Schema.Types.ObjectId, ref: "AccountTemplate", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },

    accountNumber: { type: String, required: true, unique: true },
    model: { type: String, enum: ["INSTANT", "ONE_STEP", "THREE_STEP"], required: true },
    accountSize: { type: Number, required: true },

    startingBalance: { type: Number, required: true },
    currentBalance: { type: Number, required: true },
    currentEquity: { type: Number, required: true },

    profit: { type: Number, default: 0 },
    loss: { type: Number, default: 0 },

    tradingDays: { type: Number, default: 0 },

    status: {
      type: String,
      enum: [
        "PENDING_PAYMENT", "PAYMENT_UNDER_REVIEW", "PAYMENT_APPROVED",
        "ACCOUNT_CREATING", "ACTIVE", "EVALUATION", "PHASE_1", "PHASE_2", "PHASE_3",
        "PASSED", "FUNDED", "PAYOUT_ELIGIBLE", "PAYOUT_PENDING",
        "BREACHED", "FAILED", "SUSPENDED", "COMPLETED", "CLOSED",
      ],
      default: "PENDING_PAYMENT",
    },

    currentPhase: { type: Number, default: 1 },

    // immutable snapshot of the rules that applied when purchased
    ruleSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },

    // admin overrides layered on top of ruleSnapshot for THIS account only
    overrides: { type: mongoose.Schema.Types.Mixed, default: {} },

    platform: { type: String, default: "MT5" },
    tradingUsername: String,
    credentialStatus: { type: String, enum: ["PENDING", "ISSUED", "RESET_REQUIRED"], default: "PENDING" },

    payoutStatus: { type: String, enum: ["NOT_ELIGIBLE", "ELIGIBLE", "PENDING", "PROCESSING", "PAID"], default: "NOT_ELIGIBLE" },
    nextPayoutDate: Date,
  },
  { timestamps: true }
);

// Effective rule = snapshot merged with any per-account override
accountSchema.methods.getEffectiveRules = function () {
  return { ...(this.ruleSnapshot || {}), ...(this.overrides || {}) };
};

module.exports = mongoose.model("Account", accountSchema);
