/**
 * Centralized Formula Engine (PRD Section 109)
 * All trading-rule and pricing math lives here so it is never duplicated
 * or hard-coded elsewhere in controllers/UI.
 */

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const profitTarget = (startingBalance, profitTargetPercent) =>
  round2(startingBalance * (profitTargetPercent / 100));

const maxOverallLossAmount = (startingBalance, overallLossPercent) =>
  round2(startingBalance * (overallLossPercent / 100));

const dailyLossAmount = (dailyReferenceBalance, dailyLossPercent) =>
  round2(dailyReferenceBalance * (dailyLossPercent / 100));

const dailyLossThreshold = (dailyReferenceBalance, dailyLossAmt) =>
  round2(dailyReferenceBalance - dailyLossAmt);

const staticDrawdownFloor = (startingBalance, maxLossAmt) =>
  round2(startingBalance - maxLossAmt);

const trailingDrawdownFloor = (highestBalanceOrEquity, trailingAmt) =>
  round2(highestBalanceOrEquity - trailingAmt);

const consistencyPercent = (bestDayProfit, totalProfit) =>
  totalProfit > 0 ? round2((bestDayProfit / totalProfit) * 100) : 0;

const profitShare = (eligibleProfit, profitSplitPercent) =>
  round2(eligibleProfit * (profitSplitPercent / 100));

/**
 * Discount Priority Engine (PRD Section 110)
 * IF approved referral exists -> apply referral discount, ignore coupon.
 * ELSE IF valid coupon exists -> apply coupon.
 * ELSE -> original/sale price.
 * Referral and coupon discounts NEVER stack.
 */
const REFERRAL_DISCOUNT_PERCENT = 40;
const AFFILIATE_COMMISSION_PERCENT = 40;

function computeOrderPricing({ originalPrice, hasApprovedReferral, couponPercent }) {
  const base = originalPrice;

  if (hasApprovedReferral) {
    const referralDiscount = round2(base * (REFERRAL_DISCOUNT_PERCENT / 100));
    return {
      originalPrice: base,
      couponPercentage: 0,
      couponDiscount: 0,
      referralPercentage: REFERRAL_DISCOUNT_PERCENT,
      referralDiscount,
      finalPrice: round2(base - referralDiscount),
      discountSource: "REFERRAL",
    };
  }

  if (couponPercent && couponPercent > 0) {
    const couponDiscount = round2(base * (couponPercent / 100));
    return {
      originalPrice: base,
      couponPercentage: couponPercent,
      couponDiscount,
      referralPercentage: 0,
      referralDiscount: 0,
      finalPrice: round2(base - couponDiscount),
      discountSource: "COUPON",
    };
  }

  return {
    originalPrice: base,
    couponPercentage: 0,
    couponDiscount: 0,
    referralPercentage: 0,
    referralDiscount: 0,
    finalPrice: base,
    discountSource: "NONE",
  };
}

function computeAffiliateCommission(originalPrice) {
  return round2(originalPrice * (AFFILIATE_COMMISSION_PERCENT / 100));
}

module.exports = {
  round2,
  profitTarget,
  maxOverallLossAmount,
  dailyLossAmount,
  dailyLossThreshold,
  staticDrawdownFloor,
  trailingDrawdownFloor,
  consistencyPercent,
  profitShare,
  computeOrderPricing,
  computeAffiliateCommission,
  REFERRAL_DISCOUNT_PERCENT,
  AFFILIATE_COMMISSION_PERCENT,
};
