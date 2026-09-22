import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function Rules() {
  const [templates, setTemplates] = useState([]);
  useEffect(() => { api.get("/accounts-catalog/templates").then(({ data }) => setTemplates(data.templates)); }, []);

  const byModel = templates.reduce((acc, t) => { (acc[t.model] = acc[t.model] || []).push(t); return acc; }, {});

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="max-w-2xl mb-12">
        <div className="text-brand text-xs font-semibold uppercase tracking-[0.2em] mb-3">Trade with clarity</div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Rules that stay clear.</h1>
        <p className="text-textSecondary leading-relaxed">Every account is built around transparent limits and measurable objectives, so you always know where you stand.</p>
      </div>
      {Object.entries(byModel).map(([model, items]) => (
        <div key={model} className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="text-xl font-bold">{model.replace("_", " ")}</h2><p className="text-textMuted text-sm mt-1">{items.length} account option{items.length === 1 ? "" : "s"}</p></div>
            <span className="text-brand text-xs uppercase tracking-wider border border-brand/30 bg-brand/5 rounded-full px-3 py-1">Live rules</span>
          </div>
          <div className="card overflow-x-auto shadow-lg">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-textMuted text-left border-b border-borderDark bg-bgSecondary/60">
                <tr>
                  <th className="p-4 font-medium">Size</th><th className="font-medium">Profit Target</th><th className="font-medium">Max Overall Loss</th><th className="font-medium">Daily Loss</th><th className="font-medium">Min Days</th><th className="font-medium">Profit Split</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t._id} className="border-b border-borderDark last:border-0 hover:bg-bgSecondary/40 transition-colors">
                    <td className="p-4 font-semibold text-brand">${t.accountSize.toLocaleString()}</td>
                    <td>{t.model === "THREE_STEP" ? `${t.profitTargetPerPhasePercent}%/phase` : t.profitTargetPercent ? `${t.profitTargetPercent}%` : "N/A"}</td>
                    <td>{t.maxOverallLossPercent}%</td><td>{t.maxDailyLossPercent}%</td><td>{t.minTradingDays}</td><td className="font-semibold">{t.profitSplitDefault}–{t.profitSplitMaximum}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
