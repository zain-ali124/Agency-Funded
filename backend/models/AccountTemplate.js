const mongoose = require("mongoose");

// This is the GLOBAL, admin-editable template for a given (model, size) product.
// Purchased Accounts snapshot these values at purchase time (see Account.ruleSnapshot).
const accountTemplateSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "AccountCategory", required: true },
    model: { type: String, enum: ["INSTANT", "ONE_STEP", "THREE_STEP"], required: true },
    accountSize: { type: Number, required: true },

    originalPrice: { type: Number, required: true },
    salePrice: { type: Number }, // optional promo price, must be <= originalPrice

    tradingPeriod: { type: String, default: "Unlimited" },
    minTradingDays: { type: Number, default: 0 },
    minDailyProfitPercent: { type: Number, default: 0 },

    profitTargetPercent: { type: Number, default: 0 }, // 0/N-A for Instant
    profitTargetPerPhasePercent: { type: Number, default: 0 }, // for 3-step

    maxOverallLossPercent: { type: Number, required: true },
    overallLossType: { type: String, enum: ["STATIC", "TRAILING"], default: "STATIC" },

    maxDailyLossPercent: { type: Number, required: true },
    dailyLossType: { type: String, enum: ["DAILY_REFERENCE", "TRAILING"], default: "DAILY_REFERENCE" },

    eaAllowed: { type: Boolean, default: true },
    botsAllowed: { type: Boolean, default: true },
    copyTradingAllowed: { type: Boolean, default: false },
    newsTrading: { type: String, enum: ["ALLOWED", "RESTRICTED", "PROHIBITED"], default: "ALLOWED" },
    weekendTrading: { type: String, enum: ["ALLOWED", "HOLD_ONLY", "PROHIBITED"], default: "ALLOWED" },

    consistencyRulePercent: { type: Number, default: 0 },

    profitSplitDefault: { type: Number, default: 80 },
    profitSplitMaximum: { type: Number, default: 100 },

    refundable: { type: Boolean, default: true },
    refundAfterPayoutNumber: { type: Number, default: 3 },

    payoutFirstDays: { type: Number, default: 14 },
    payoutRecurringDays: { type: Number, default: 14 },
    payoutMinimum: { type: Number, default: 0 },

    leverage: {
      forexEvaluation: { type: String, default: "1:100" },
      indicesEvaluation: { type: String, default: "1:20" },
      commoditiesEvaluation: { type: String, default: "1:20" },
      cryptoEvaluation: { type: String, default: "1:2" },
      forexFunded: { type: String, default: "1:50" },
      indicesFunded: { type: String, default: "1:10" },
      commoditiesFunded: { type: String, default: "1:10" },
      cryptoFunded: { type: String, default: "1:1" },
    },

    phases: { type: Number, default: 0 }, // 0 = instant, 1 = 1-step, 3 = 3-step

    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

accountTemplateSchema.index({ model: 1, accountSize: 1 }, { unique: true });

module.exports = mongoose.model("AccountTemplate", accountTemplateSchema);
