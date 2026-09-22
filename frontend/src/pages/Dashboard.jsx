import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full h-2 bg-bgSecondary rounded-full overflow-hidden">
      <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/accounts/mine").then(({ data }) => setAccounts(data.accounts)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
      <h1 className="text-2xl sm:text-3xl font-extrabold mb-1 break-words">Welcome back, {user?.firstName}</h1>
      <p className="text-textMuted mb-8 sm:mb-10">Here's an overview of your funded accounts.</p>

      {loading ? (
        <p className="text-textMuted">Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-textMuted mb-4">You don't have any active accounts yet.</p>
          <a href="/accounts" className="btn-primary">Get Funded</a>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {accounts.map((a) => (
            <div key={a._id} className="card p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-6">
                <div className="min-w-0">
                  <div className="label-muted">{a.accountNumber}</div>
                  <div className="text-lg sm:text-xl font-extrabold break-words">${(a.accountSize / 1000).toFixed(0)}K — {a.model.replace("_", " ")}</div>
                </div>
                <span className="self-start px-3 py-1 rounded-sm text-xs font-bold bg-brand/10 text-brand border border-brand/30">{a.status}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div><div className="label-muted">Balance</div><div className="font-bold">${a.currentBalance?.toLocaleString()}</div></div>
                <div><div className="label-muted">Equity</div><div className="font-bold">${a.currentEquity?.toLocaleString()}</div></div>
                <div><div className="label-muted">Profit</div><div className="font-bold text-brand">+${a.profit?.toLocaleString()}</div></div>
                <div><div className="label-muted">Loss</div><div className="font-bold text-danger">-${a.loss?.toLocaleString()}</div></div>
              </div>

              {a.metrics?.profitTargetAmount > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-textMuted mb-1"><span>Profit Target</span><span>${a.profit} / ${a.metrics.profitTargetAmount}</span></div>
                  <ProgressBar value={a.profit} max={a.metrics.profitTargetAmount} />
                </div>
              )}
              <div className="mb-4">
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-textMuted mb-1"><span>Max Daily Loss</span><span>${a.loss} / ${a.metrics?.maxDailyLossAmount}</span></div>
                <ProgressBar value={a.loss} max={a.metrics?.maxDailyLossAmount} />
              </div>
              <div>
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-textMuted mb-1"><span>Max Overall Loss</span><span>${a.loss} / ${a.metrics?.maxOverallLossAmount}</span></div>
                <ProgressBar value={a.loss} max={a.metrics?.maxOverallLossAmount} />
              </div>
              <div className="text-xs text-textMuted mt-4">Trading Days: {a.metrics?.tradingDaysProgress}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
