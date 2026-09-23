import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Affiliate() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [applied, setApplied] = useState(false);
  const [withdrawal, setWithdrawal] = useState({ amount: "", paymentMethod: "", paymentAddress: "", additionalInfo: "" });
  const [withdrawalMessage, setWithdrawalMessage] = useState("");
  const [form, setForm] = useState({ website: "", socialMedia: "", promotionMethod: "", audienceSize: "" });

  useEffect(() => {
    if (user?.affiliateStatus === "APPROVED") {
      api.get("/affiliate/dashboard").then(({ data }) => setDashboard(data));
    }
  }, [user]);

  const apply = async (e) => {
    e.preventDefault();
    await api.post("/affiliate/apply", form);
    setApplied(true);
  };

  const requestWithdrawal = async (e) => {
    e.preventDefault();
    setWithdrawalMessage("");
    try {
      await api.post("/affiliate/withdraw", withdrawal);
      setWithdrawal({ amount: "", paymentMethod: "", paymentAddress: "", additionalInfo: "" });
      setWithdrawalMessage("Withdrawal request submitted for admin review.");
      const { data } = await api.get("/affiliate/dashboard");
      setDashboard(data);
    } catch (err) {
      setWithdrawalMessage(err.response?.data?.message || "Unable to submit withdrawal request.");
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-extrabold mb-4">Become an Affiliate</h1>
        <p className="text-textMuted mb-6">Login or create an account to apply for the Agency Funded affiliate program —some% referral discount for your audience, and commission for you.</p>
        <a href="/login" className="btn-primary">Login</a>
      </div>
    );
  }

  if (user.affiliateStatus === "APPROVED" && dashboard) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 pb-28">
        <h1 className="text-2xl font-extrabold mb-8">Affiliate Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-5"><div className="label-muted">Total Clicks</div><div className="text-2xl font-extrabold">{dashboard.stats.totalClicks}</div></div>
          <div className="card p-5"><div className="label-muted">Referrals</div><div className="text-2xl font-extrabold">{dashboard.stats.registeredReferrals}</div></div>
          <div className="card p-5"><div className="label-muted">Total Commission</div><div className="text-2xl font-extrabold text-brand">${dashboard.stats.totalCommission}</div></div>
          <div className="card p-5"><div className="label-muted">Available Balance</div><div className="text-2xl font-extrabold text-brand">${dashboard.stats.availableBalance}</div></div>
        </div>
        <div className="card p-4 sm:p-6 mb-8 min-w-0">
          <div className="label-muted mb-2">Your Referral Link</div>
          <div className="flex flex-col sm:flex-row gap-2 min-w-0">
            <input readOnly value={dashboard.referralLink} title={dashboard.referralLink} className="min-w-0 w-full flex-1 bg-bgSecondary border border-borderDark rounded-sm px-4 py-2 text-sm truncate" />
            <button onClick={() => navigator.clipboard.writeText(dashboard.referralLink)} className="btn-secondary text-sm shrink-0 w-full sm:w-auto">Copy</button>
          </div>
        </div>
        <div className="card p-6 mb-8">
          <div className="label-muted mb-1">Request a withdrawal</div>
          <p className="text-sm text-textMuted mb-4">Available: ${dashboard.stats.availableBalance.toFixed(2)}</p>
          <form onSubmit={requestWithdrawal} className="grid md:grid-cols-2 gap-3">
            <input required type="number" min="0.01" step="0.01" max={dashboard.stats.availableBalance} placeholder="Amount" value={withdrawal.amount} onChange={(e) => setWithdrawal({ ...withdrawal, amount: e.target.value })} className="bg-bgSecondary border border-borderDark rounded-sm px-4 py-3" />
            <input required placeholder="Payment method" value={withdrawal.paymentMethod} onChange={(e) => setWithdrawal({ ...withdrawal, paymentMethod: e.target.value })} className="bg-bgSecondary border border-borderDark rounded-sm px-4 py-3" />
            <input required placeholder="Payment address / account" value={withdrawal.paymentAddress} onChange={(e) => setWithdrawal({ ...withdrawal, paymentAddress: e.target.value })} className="bg-bgSecondary border border-borderDark rounded-sm px-4 py-3" />
            <input placeholder="Additional information" value={withdrawal.additionalInfo} onChange={(e) => setWithdrawal({ ...withdrawal, additionalInfo: e.target.value })} className="bg-bgSecondary border border-borderDark rounded-sm px-4 py-3" />
            <div className="md:col-span-2 flex items-center justify-between gap-4"><p className="text-sm text-textMuted">{withdrawalMessage}</p><button className="btn-primary">Request Withdrawal</button></div>
          </form>
        </div>
        <div className="card p-4 sm:p-6 overflow-hidden">
          <div className="label-muted mb-4">Recent Commissions</div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-textMuted text-left"><tr><th className="pb-2">Order</th><th>Original Price</th><th>Commission</th><th>Commission Status</th><th>Payout</th></tr></thead>
            <tbody>
              {dashboard.commissions.map((c) => (
                <tr key={c._id} className="border-t border-borderDark">
                  <td className="py-2">{c.order?.orderId}</td>
                  <td>${c.originalPrice}</td>
                  <td className="text-brand">${c.commissionAmount}</td>
                  <td>{c.status}</td>
                  <td className={c.payoutStatus === "PAID" ? "text-brand" : "text-textMuted"}>{c.payoutStatus || "Not withdrawn"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        <div className="card p-6 mt-8">
          <div className="label-muted mb-4">Withdrawal history</div>
          <div className="space-y-2 text-sm">
            {dashboard.withdrawals.length === 0 && <p className="text-textMuted">No withdrawal requests yet.</p>}
            {dashboard.withdrawals.map((item) => <div key={item._id} className="flex justify-between border-t border-borderDark pt-2"><span>${item.amount.toFixed(2)} via {item.paymentMethod}</span><span className="text-textMuted">{item.status}</span></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (user.affiliateStatus === "PENDING" || applied) {
    return <div className="max-w-lg mx-auto px-6 py-24 text-center"><h1 className="text-2xl font-extrabold mb-4">Application Under Review</h1><p className="text-textMuted">We'll email you once your affiliate application has been reviewed.</p></div>;
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-24">
      <h1 className="text-2xl font-extrabold mb-2">Become an Affiliate</h1>
      <p className="text-textMuted mb-8">Earn 40% commission on every referral. Your audience gets a 40% discount.</p>
      <form onSubmit={apply} className="card p-6 space-y-4">
        <input placeholder="Website (optional)" className="w-full bg-bgSecondary border border-borderDark rounded-sm px-4 py-3" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        <input placeholder="Social Media" className="w-full bg-bgSecondary border border-borderDark rounded-sm px-4 py-3" value={form.socialMedia} onChange={(e) => setForm({ ...form, socialMedia: e.target.value })} />
        <input placeholder="Promotion Method" className="w-full bg-bgSecondary border border-borderDark rounded-sm px-4 py-3" value={form.promotionMethod} onChange={(e) => setForm({ ...form, promotionMethod: e.target.value })} />
        <input placeholder="Audience Size" className="w-full bg-bgSecondary border border-borderDark rounded-sm px-4 py-3" value={form.audienceSize} onChange={(e) => setForm({ ...form, audienceSize: e.target.value })} />
        <button className="btn-primary w-full">Apply Now</button>
      </form>
    </div>
  );
}
