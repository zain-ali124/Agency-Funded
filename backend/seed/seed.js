require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const AccountCategory = require("../models/AccountCategory");
const AccountTemplate = require("../models/AccountTemplate");
const PaymentMethod = require("../models/PaymentMethod");
const FAQ = require("../models/FAQ");

async function seed() {
  await connectDB();

  console.log("Seeding Agency Funded initial dataset...");

  // ----- Super Admin -----
  const adminEmail = "admin@agencyfunded.com";
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const passwordHash = await User.hashPassword("ChangeMe123!");
    await User.create({
      firstName: "Agency",
      lastName: "Admin",
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      emailVerified: true,
    });
    console.log(`Created SUPER_ADMIN: ${adminEmail} / ChangeMe123! (change this immediately)`);
  }

  // ----- Categories (PRD Section 5) -----
  const categoryDefs = [
    { name: "Agency Accounts", slug: "agency-accounts", displayOrder: 1 },
    { name: "Funded Pips", slug: "funded-pips", displayOrder: 2 },
    { name: "Atlas Funded", slug: "atlas-funded", displayOrder: 3 },
    { name: "Other Funded", slug: "other-funded", displayOrder: 4 },
  ];
  const categories = {};
  for (const def of categoryDefs) {
    let cat = await AccountCategory.findOne({ slug: def.slug });
    if (!cat) cat = await AccountCategory.create(def);
    categories[def.slug] = cat;
  }
  const agencyCategory = categories["agency-accounts"];

  // ----- Instant templates (PRD Section 7 / 11 / 108) -----
  const instantRules = {
    category: agencyCategory._id,
    model: "INSTANT",
    tradingPeriod: "Unlimited",
    minTradingDays: 5,
    minDailyProfitPercent: 1,
    profitTargetPercent: 0,
    maxOverallLossPercent: 5,
    overallLossType: "TRAILING",
    maxDailyLossPercent: 3,
    dailyLossType: "TRAILING",
    eaAllowed: true,
    profitSplitDefault: 80,
    profitSplitMaximum: 100,
    refundable: true,
    refundAfterPayoutNumber: 5,
    payoutFirstDays: 28,
    payoutRecurringDays: 14,
    consistencyRulePercent: 20,
    phases: 0,
  };
  const instantSizes = [
    { accountSize: 5000, originalPrice: 100 },
    { accountSize: 10000, originalPrice: 160 },
  ];

  // ----- 1-Step templates (PRD Section 8 / 15 / 108) -----
  const oneStepRules = {
    category: agencyCategory._id,
    model: "ONE_STEP",
    tradingPeriod: "Unlimited",
    minTradingDays: 5,
    minDailyProfitPercent: 0.5,
    profitTargetPercent: 10,
    maxOverallLossPercent: 7,
    overallLossType: "STATIC",
    maxDailyLossPercent: 4,
    dailyLossType: "DAILY_REFERENCE",
    eaAllowed: true,
    profitSplitDefault: 80,
    profitSplitMaximum: 100,
    refundable: true,
    refundAfterPayoutNumber: 3,
    payoutFirstDays: 14,
    payoutRecurringDays: 14,
    phases: 1,
  };
  const oneStepSizes = [
    { accountSize: 5000, originalPrice: 50 },
    { accountSize: 10000, originalPrice: 70 },
    { accountSize: 20000, originalPrice: 140 },
    { accountSize: 50000, originalPrice: 300 },
    { accountSize: 100000, originalPrice: 500 },
  ];

  // ----- 3-Step templates (PRD Section 9 / 20 / 108) — prices are admin-configured placeholders -----
  const threeStepRules = {
    category: agencyCategory._id,
    model: "THREE_STEP",
    tradingPeriod: "Unlimited",
    minTradingDays: 3,
    minDailyProfitPercent: 0.5,
    profitTargetPerPhasePercent: 6,
    maxOverallLossPercent: 8,
    overallLossType: "STATIC",
    maxDailyLossPercent: 4,
    dailyLossType: "DAILY_REFERENCE",
    eaAllowed: true,
    profitSplitDefault: 80,
    profitSplitMaximum: 100,
    refundable: true,
    phases: 3,
  };
  // Admin has not supplied 3-Step prices yet; seeded inactive so they never sell with invented prices.
  const threeStepSizes = [
    { accountSize: 5000, originalPrice: 0, active: false },
    { accountSize: 10000, originalPrice: 0, active: false },
    { accountSize: 20000, originalPrice: 0, active: false },
    { accountSize: 50000, originalPrice: 0, active: false },
    { accountSize: 100000, originalPrice: 0, active: false },
  ];

  async function upsertTemplates(ruleBase, sizes) {
    for (const size of sizes) {
      const doc = { ...ruleBase, ...size };
      await AccountTemplate.findOneAndUpdate(
        { model: ruleBase.model, accountSize: size.accountSize },
        doc,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  await upsertTemplates(instantRules, instantSizes);
  await upsertTemplates(oneStepRules, oneStepSizes);
  await upsertTemplates(threeStepRules, threeStepSizes);

  // ----- Payment methods (PRD Section 42/124) -----
  const paymentMethods = [
    { methodName: "Bank Transfer", accountName: "Agency Funded", instructions: "Send exact amount and upload your transfer receipt.", displayOrder: 1 },
    { methodName: "JazzCash", accountName: "Agency Funded", instructions: "Send exact amount and upload a screenshot of the transaction.", displayOrder: 2 },
    { methodName: "Easypaisa", accountName: "Agency Funded", instructions: "Send exact amount and upload a screenshot of the transaction.", displayOrder: 3 },
    { methodName: "Crypto (USDT)", walletAddress: "SET_WALLET_ADDRESS_IN_ADMIN", instructions: "Send the exact USD-equivalent amount and upload the transaction hash screenshot.", displayOrder: 4 },
  ];
  for (const pm of paymentMethods) {
    const exists = await PaymentMethod.findOne({ methodName: pm.methodName });
    if (!exists) await PaymentMethod.create(pm);
  }

  // ----- Starter FAQs (PRD Section 78) -----
  const faqs = [
    { question: "What is Agency Funded?", answer: "Agency Funded provides access to funded trading accounts through Instant, 1-Step and 3-Step programs, with transparent, database-driven rules.", category: "General", displayOrder: 1 },
    { question: "What is 1-Step?", answer: "1-Step is a single evaluation phase: reach the profit target while respecting the daily and overall loss limits, then get funded.", category: "Accounts", displayOrder: 1 },
    { question: "Can I buy without registering?", answer: "Yes, guest checkout is supported. You can also register to track your orders and accounts in one place.", category: "Payment", displayOrder: 1 },
    { question: "Can coupons and referral discounts combine?", answer: "No. If an approved referral discount is active, it is applied instead of any coupon; they never stack.", category: "Affiliate", displayOrder: 1 },
  ];
  for (const f of faqs) {
    const exists = await FAQ.findOne({ question: f.question });
    if (!exists) await FAQ.create(f);
  }

  console.log("Seeding complete.");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
