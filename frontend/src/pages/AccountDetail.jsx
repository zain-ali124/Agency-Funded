import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

const MODEL_LABELS = { INSTANT: "Instant", ONE_STEP: "1 Step", THREE_STEP: "3 Step" };

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);

  useEffect(() => {
    api.get(`/accounts-catalog/templates/${id}`).then(({ data }) => setTemplate(data.template));
  }, [id]);

  if (!template) return <div className="max-w-4xl mx-auto px-6 py-24 text-textMuted">Loading…</div>;

  const price = template.salePrice ?? template.originalPrice;
  const rows = [
    ["Trading Period", template.tradingPeriod],
    ["Minimum Trading Days", template.minTradingDays],
    template.model === "THREE_STEP"
      ? ["Profit Target (per phase)", `${template.profitTargetPerPhasePercent}%`]
      : template.model === "ONE_STEP"
      ? ["Profit Target", `${template.profitTargetPercent}%`]
      : ["Profit Target", "N/A"],
    ["Maximum Overall Loss", `${template.maxOverallLossPercent}% (${template.overallLossType.toLowerCase()})`],
    ["Maximum Daily Loss", `${template.maxDailyLossPercent}%`],
    ["Expert Advisors", template.eaAllowed ? "Allowed" : "Not Allowed"],
    ["Profit Split", `${template.profitSplitDefault}% default / up to ${template.profitSplitMaximum}%`],
    ["Refund", template.refundable ? `After ${template.refundAfterPayoutNumber}th payout` : "Not refundable"],
    ["Payout Schedule", `First payout in ${template.payoutFirstDays} days, then every ${template.payoutRecurringDays} days`],
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="label-muted mb-2">{MODEL_LABELS[template.model]}</div>
      <h1 className="text-3xl font-extrabold mb-6">${(template.accountSize / 1000).toFixed(0)},000 {MODEL_LABELS[template.model]} Account</h1>

      <div className="card p-8 mb-8">
        <div className="text-4xl font-extrabold text-brand mb-6">${price}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-borderDark pb-2">
              <span className="text-textMuted text-sm">{label}</span>
              <span className="font-semibold text-sm">{value}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate(`/checkout/${template._id}`)}
          className="btn-primary w-full mt-8"
          disabled={!template.active}
        >
          {template.active ? "GET FUNDED →" : "Currently Unavailable"}
        </button>
      </div>
    </div>
  );
}
