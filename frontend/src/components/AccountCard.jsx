import React from "react";
import { Link } from "react-router-dom";

const MODEL_LABELS = { INSTANT: "Instant", ONE_STEP: "1 Step", THREE_STEP: "3 Step" };

export default function AccountCard({ template }) {
  const price = template.salePrice ?? template.originalPrice;
  const hasDiscount = template.salePrice && template.salePrice < template.originalPrice;

  return (
    <div className={`card p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform ${template.featured ? "border-brand shadow-glow" : ""}`}>
      {template.featured && (
        <span className="text-[11px] font-bold text-brand bg-brand/10 border border-brand/40 rounded-sm px-2 py-1 w-fit">★ MOST POPULAR</span>
      )}
      <div>
        <div className="label-muted">{MODEL_LABELS[template.model]}</div>
        <div className="text-2xl font-extrabold">${(template.accountSize / 1000).toFixed(0)}K Account</div>
      </div>
      <div className="flex items-end gap-2">
        {hasDiscount && <span className="text-textMuted line-through text-sm">${template.originalPrice}</span>}
        <span className="text-3xl font-extrabold text-brand">${price}</span>
      </div>
      <ul className="text-sm text-textSecondary space-y-1">
        {template.model !== "INSTANT" && (
          <li>Profit Target: <span className="text-white">{template.model === "THREE_STEP" ? template.profitTargetPerPhasePercent : template.profitTargetPercent}%{template.model === "THREE_STEP" ? " / phase" : ""}</span></li>
        )}
        <li>Max Overall Loss: <span className="text-white">{template.maxOverallLossPercent}%</span></li>
        <li>Daily Loss: <span className="text-white">{template.maxDailyLossPercent}%</span></li>
        <li>Profit Split: <span className="text-white">Up to {template.profitSplitMaximum}%</span></li>
      </ul>
      <Link to={`/accounts/${template._id}`} className="btn-primary text-center mt-2">Get Funded →</Link>
    </div>
  );
}
