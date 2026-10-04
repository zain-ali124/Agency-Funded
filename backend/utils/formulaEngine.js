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
 * An approved affiliate referral keeps the customer price at the listed price;
 * promotional coupons remain unavailable for that order.
 * Otherwise, apply a valid coupon or use the listed price.
 */
const AFFILIATE_COMMISSION_PERCENT = 40;

function computeOrderPricing({ originalPrice, hasApprovedReferral, couponPercent }) {
  const base = originalPrice;

  if (hasApprovedReferral) {
    return {
      originalPrice: base,
      couponPercentage: 0,
      couponDiscount: 0,
      referralPercentage: 0,
      referralDiscount: 0,
      finalPrice: base,
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
  AFFILIATE_COMMISSION_PERCENT,
};
