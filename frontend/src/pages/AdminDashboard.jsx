import React, { useEffect, useState } from "react";
import { Link, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import api, { apiOrigin } from "../api/axios";

// --- SUB-COMPONENTS ---

function Overview() {
  const [metrics, setMetrics] = useState(null);
  useEffect(() => { api.get("/admin/dashboard").then(({ data }) => setMetrics(data.metrics)); }, []);
  
  if (!metrics) return <p className="text-gray-400 animate-pulse">Loading metrics…</p>;
  
  const cards = [
    ["Total Users", metrics.totalUsers],
    ["Active Accounts", metrics.activeAccounts],
    ["Pending Orders", metrics.pendingOrders],
    ["Payment Reviews", metrics.paymentReviews],
    ["Revenue", `$${metrics.revenue}`],
    ["Affiliate Commission", `$${metrics.affiliateCommissionTotal}`],
    ["Pending Withdrawals", metrics.pendingWithdrawals],
    ["Pending Payouts", metrics.customerPayoutsPending],
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {cards.map(([label, value]) => (
        <div key={label} className="bg-[#0A0F0D] border border-[#1A3326] rounded-2xl p-4 sm:p-6 flex flex-col justify-between hover:border-[#00E676] transition-colors min-w-0">
          <div className="text-gray-400 text-xs sm:text-sm font-medium mb-2 break-words">{label}</div>
          <div className="text-xl sm:text-3xl font-bold text-white tracking-tight break-words">{value}</div>
        </div>
      ))}
    </div>
  );
}

function OrdersReview() {
  const [orders, setOrders] = useState([]);
  const load = () => api.get("/admin/orders", { params: { status: "PAYMENT_UNDER_REVIEW" } }).then(({ data }) => setOrders(data.orders));
  useEffect(() => { load(); }, []);

  const approve = async (orderId) => { await api.put(`/admin/orders/${orderId}/approve`); load(); };
  const reject = async (orderId) => {
    const reason = prompt("Rejection reason?") || "Not specified";
    await api.put(`/admin/orders/${orderId}/reject`, { reason }); load();
  };

  const paymentProofUrl = (fileUrl) => (
    fileUrl?.startsWith("http") ? fileUrl : `${apiOrigin}${fileUrl}`
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">Payment Reviews</h2>
      {orders.length === 0 && <p className="text-gray-400 text-sm bg-[#0A0F0D] border border-[#1A3326] p-6 rounded-2xl">No orders pending review.</p>}
      
      <div className="grid gap-4">
        {orders.map((o) => (
          <div key={o._id} className="bg-[#0A0F0D] border border-[#1A3326] rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1 min-w-0 break-words">
              <div className="font-semibold text-lg text-white">
                {o.orderId} — <span className="text-[#00E676]">${o.finalPrice}</span> 
                <span className="text-gray-500 text-sm ml-2 font-normal">(orig ${o.originalPrice})</span>
              </div>
              <div className="text-sm text-gray-400">
                {o.customerDetails?.firstName} {o.customerDetails?.lastName} · {o.customerDetails?.email || o.guestEmail} · {o.accountModel} ${o.accountSize}
              </div>
              {o.paymentProof?.fileUrl && (
                <a href={paymentProofUrl(o.paymentProof.fileUrl)} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[#00E676] text-sm font-medium hover:underline">
                  View Payment Proof ↗
                </a>
              )}
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button onClick={() => approve(o.orderId)} className="flex-1 md:flex-none bg-[#00E676] text-[#050A08] font-semibold text-sm py-2 px-6 rounded-lg hover:bg-[#00c853] transition-colors">
                Approve
              </button>
              <button onClick={() => reject(o.orderId)} className="flex-1 md:flex-none bg-[#1A3326] text-white font-medium text-sm py-2 px-6 rounded-lg hover:bg-[#2A4536] transition-colors">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const emptyPaymentMethod = {
  methodName: "",
  accountName: "",
  accountNumber: "",
  iban: "",
  walletAddress: "",
  qrCodeUrl: "",
  instructions: "",
  minimumAmount: 0,
  active: true,
  displayOrder: 0,
};

function PaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [form, setForm] = useState(emptyPaymentMethod);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api.get("/payment-methods/admin")
      .then(({ data }) => setMethods(data.methods))
      .catch(() => setError("Unable to load payment methods."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setForm(emptyPaymentMethod);
    setEditingId(null);
    setError("");
  };

  const editMethod = (method) => {
    setEditingId(method._id);
    setForm({ ...emptyPaymentMethod, ...method });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveMethod = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      minimumAmount: Number(form.minimumAmount) || 0,
      displayOrder: Number(form.displayOrder) || 0,
    };

    try {
      if (editingId) await api.put(`/payment-methods/${editingId}`, payload);
      else await api.post("/payment-methods", payload);
      resetForm();
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save payment method.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (method) => {
    try {
      await api.put(`/payment-methods/${method._id}`, { active: !method.active });
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update payment method.");
    }
  };

  const inputClass = "w-full bg-[#050A08] border border-[#1A3326] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00E676] transition-colors";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Payment Methods</h2>
        <p className="text-sm text-gray-400 mt-1">Manage the payment details customers see at checkout.</p>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-4 rounded-xl">{error}</p>}

      <form onSubmit={saveMethod} className="bg-[#0A0F0D] border border-[#1A3326] rounded-2xl p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-semibold text-white">{editingId ? "Edit payment method" : "Add payment method"}</h3>
          {editingId && <button type="button" onClick={resetForm} className="text-sm text-gray-400 hover:text-white">Cancel edit</button>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ["methodName", "Method name", true],
            ["accountName", "Account name"],
            ["accountNumber", "Account number"],
            ["iban", "IBAN"],
            ["walletAddress", "Wallet address"],
            ["qrCodeUrl", "QR code URL"],
          ].map(([name, label, required]) => (
            <label key={name} className="text-sm text-gray-400 space-y-2">
              {label}
              <input name={name} value={form[name]} onChange={updateField} required={required} className={inputClass} />
            </label>
          ))}
          <label className="text-sm text-gray-400 space-y-2">
            Minimum amount
            <input type="number" min="0" step="0.01" name="minimumAmount" value={form.minimumAmount} onChange={updateField} className={inputClass} />
          </label>
          <label className="text-sm text-gray-400 space-y-2">
            Display order
            <input type="number" min="0" name="displayOrder" value={form.displayOrder} onChange={updateField} className={inputClass} />
          </label>
        </div>
        <label className="block text-sm text-gray-400 space-y-2">
          Instructions
          <textarea name="instructions" value={form.instructions} onChange={updateField} rows="3" className={inputClass} />
        </label>
        <label className="flex items-center gap-3 text-sm text-gray-300">
          <input type="checkbox" name="active" checked={form.active} onChange={updateField} className="h-4 w-4 accent-[#00E676]" />
          Available at checkout
        </label>
        <button type="submit" disabled={saving} className="bg-[#00E676] text-[#050A08] font-semibold text-sm py-2.5 px-5 rounded-lg hover:bg-[#00c853] disabled:opacity-50 transition-colors">
          {saving ? "Saving..." : editingId ? "Update payment method" : "Add payment method"}
        </button>
      </form>

      {loading && <p className="text-gray-400 text-sm animate-pulse">Loading payment methods...</p>}
      {!loading && methods.length === 0 && <p className="text-gray-400 text-sm bg-[#0A0F0D] border border-[#1A3326] p-6 rounded-2xl">No payment methods configured.</p>}
      <div className="grid gap-4">
        {methods.map((method) => (
          <div key={method._id} className="bg-[#0A0F0D] border border-[#1A3326] rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-1 min-w-0 break-words">
              <div className="font-semibold text-lg text-white">{method.methodName}</div>
              <div className="text-sm text-gray-400">{method.accountName || method.accountNumber || method.walletAddress || "No account details"}</div>
              <div className="text-xs text-gray-500">Minimum: ${method.minimumAmount || 0} · Order: {method.displayOrder || 0}</div>
              {method.instructions && <div className="text-sm text-gray-500 mt-2">{method.instructions}</div>}
            </div>
            <div className="flex gap-3 items-center">
              <button type="button" onClick={() => toggleActive(method)} className={`text-sm font-medium py-2 px-3 rounded-lg transition-colors ${method.active ? "bg-[#00E676]/10 text-[#00E676]" : "bg-gray-800 text-gray-400"}`}>
                {method.active ? "Active" : "Inactive"}
              </button>
              <button type="button" onClick={() => editMethod(method)} className="bg-[#1A3326] text-white font-medium text-sm py-2 px-4 rounded-lg hover:bg-[#2A4536] transition-colors">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Templates() {
  const [templates, setTemplates] = useState([]);
  const load = () => api.get("/accounts-catalog/templates", { params: { admin: true } }).then(({ data }) => setTemplates(data.templates));
  useEffect(() => { load(); }, []);

  const updatePrice = async (id, field, value) => {
    await api.put(`/accounts-catalog/templates/${id}`, { [field]: Number(value) });
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">Account Templates & Pricing</h2>
      <div className="bg-[#0A0F0D] border border-[#1A3326] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm text-left">
          <thead className="bg-[#050A08] text-gray-400 text-xs uppercase tracking-wider border-b border-[#1A3326]">
            <tr>
              <th className="px-6 py-4 font-medium">Model</th>
              <th className="px-6 py-4 font-medium">Size</th>
              <th className="px-6 py-4 font-medium">Original Price</th>
              <th className="px-6 py-4 font-medium">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A3326]">
            {templates.map((t) => (
              <tr key={t._id} className="hover:bg-[#1A3326]/30 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{t.model}</td>
                <td className="px-6 py-4 text-gray-300">${t.accountSize.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <input 
                    type="number" 
                    defaultValue={t.originalPrice} 
                    onBlur={(e) => updatePrice(t._id, "originalPrice", e.target.value)}
                    className="bg-[#050A08] border border-[#1A3326] text-white rounded-lg px-3 py-1.5 w-28 focus:outline-none focus:border-[#00E676] transition-colors" 
                  />
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${t.active ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-gray-800 text-gray-400'}`}>
                    {t.active ? "Yes" : "No"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function AffiliateApplications() {
  const [apps, setApps] = useState([]);
  const load = () => api.get("/affiliate/admin/applications", { params: { status: "PENDING" } }).then(({ data }) => setApps(data.applications));
  useEffect(() => { load(); }, []);
  const review = async (id, decision) => { await api.put(`/affiliate/admin/applications/${id}`, { decision }); load(); };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">Affiliate Applications</h2>
      {apps.length === 0 && <p className="text-gray-400 text-sm bg-[#0A0F0D] border border-[#1A3326] p-6 rounded-2xl">No pending applications.</p>}
      
      <div className="grid gap-4">
        {apps.map((a) => (
          <div key={a._id} className="bg-[#0A0F0D] border border-[#1A3326] rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="min-w-0 break-words">
              <div className="font-semibold text-lg text-white">{a.fullName}</div>
              <div className="text-sm text-gray-400 mt-1">{a.email} · <span className="text-[#00E676]">{a.promotionMethod}</span></div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button onClick={() => review(a._id, "APPROVED")} className="flex-1 md:flex-none bg-[#00E676] text-[#050A08] font-semibold text-sm py-2 px-6 rounded-lg hover:bg-[#00c853] transition-colors">Approve</button>
              <button onClick={() => review(a._id, "REJECTED")} className="flex-1 md:flex-none bg-[#1A3326] text-white font-medium text-sm py-2 px-6 rounded-lg hover:bg-[#2A4536] transition-colors">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AffiliateWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const load = () => api.get("/affiliate/admin/withdrawals", { params: { status: "PENDING" } }).then(({ data }) => setWithdrawals(data.withdrawals));
  useEffect(() => { load(); }, []);
  const process = async (id, status) => {
    const transactionReference = status === "PAID" ? (prompt("Transaction reference?") || "") : "";
    await api.put(`/affiliate/admin/withdrawals/${id}`, { status, transactionReference });
    load();
  };
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">Affiliate Withdrawals</h2>
      {withdrawals.length === 0 && <p className="text-gray-400 text-sm bg-[#0A0F0D] border border-[#1A3326] p-6 rounded-2xl">No pending withdrawal requests.</p>}
      
      <div className="grid gap-4">
        {withdrawals.map((item) => (
          <div key={item._id} className="bg-[#0A0F0D] border border-[#1A3326] rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1 min-w-0 break-words">
              <div className="font-semibold text-lg text-white">
                {item.affiliate?.firstName} {item.affiliate?.lastName} · <span className="text-[#00E676]">${item.amount}</span>
              </div>
              <div className="text-sm text-gray-400">{item.affiliate?.email} · {item.paymentMethod} · {item.paymentAddress}</div>
              {item.additionalInfo && <div className="text-sm text-gray-500 italic">"{item.additionalInfo}"</div>}
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button onClick={() => process(item._id, "PAID")} className="flex-1 md:flex-none bg-[#00E676] text-[#050A08] font-semibold text-sm py-2 px-6 rounded-lg hover:bg-[#00c853] transition-colors">Mark Paid</button>
              <button onClick={() => process(item._id, "REJECTED")} className="flex-1 md:flex-none bg-[#1A3326] text-white font-medium text-sm py-2 px-6 rounded-lg hover:bg-[#2A4536] transition-colors">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AffiliateUsers() {
  const [users, setUsers] = useState([]);
  useEffect(() => { api.get("/affiliate/admin/users").then(({ data }) => setUsers(data.users)); }, []);
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">Affiliate Users & Earnings</h2>
      
      <div className="grid gap-6">
        {users.map(({ affiliate, referrals, earnings }) => (
          <div key={affiliate._id} className="bg-[#0A0F0D] border border-[#1A3326] rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row justify-between gap-6 pb-6 border-b border-[#1A3326]">
              <div>
                <div className="font-semibold text-xl text-white">{affiliate.firstName} {affiliate.lastName}</div>
                <div className="text-sm text-gray-400 mt-1">{affiliate.email}</div>
                <div className="inline-block mt-2 bg-[#1A3326] text-[#00E676] text-xs font-mono px-3 py-1 rounded-md">
                  Code: {affiliate.referralCode}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 text-sm bg-[#050A08] p-4 rounded-xl border border-[#1A3326]">
                <div>
                  <div className="text-gray-400 mb-1">Referrals</div>
                  <div className="font-bold text-white text-lg">{referrals.length}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Total Earned</div>
                  <div className="font-bold text-[#00E676] text-lg">${earnings.total.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Available</div>
                  <div className="font-bold text-[#00E676] text-lg">${earnings.available.toFixed(2)}</div>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Referred Users</div>
              {referrals.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {referrals.map((referral) => (
                    <div key={referral._id} className="bg-[#050A08] border border-[#1A3326] rounded-lg p-3 text-sm text-gray-300 flex items-start gap-2 min-w-0 break-words">
                      <div className="w-2 h-2 rounded-full bg-[#00E676]"></div>
                      {referral.registeredUser?.firstName} {referral.registeredUser?.lastName} 
                      <span className="text-gray-500 text-xs sm:ml-auto break-all">{referral.registeredUser?.email}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No registered users yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AllUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (value = search) => {
    setLoading(true);
    api.get("/admin/users", { params: value ? { search: value } : {} })
      .then(({ data }) => setUsers(data.users))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(""); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">All Users</h2>
        <form onSubmit={(event) => { event.preventDefault(); load(); }} className="flex gap-2 w-full sm:w-auto">
          <input 
            value={search} 
            onChange={(event) => setSearch(event.target.value)} 
            placeholder="Search name or email" 
            className="flex-1 sm:w-64 bg-[#050A08] border border-[#1A3326] text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00E676] transition-colors" 
          />
          <button className="bg-[#1A3326] text-white font-medium text-sm py-2 px-4 rounded-lg hover:bg-[#2A4536] transition-colors">Search</button>
        </form>
      </div>

      {loading && <p className="text-gray-400 text-sm animate-pulse">Loading users...</p>}
      {!loading && users.length === 0 && <p className="text-gray-400 text-sm bg-[#0A0F0D] border border-[#1A3326] p-6 rounded-2xl">No users found.</p>}
      
      <div className="grid gap-6">
        {users.map((user) => (
          <div key={user._id} className="bg-[#0A0F0D] border border-[#1A3326] rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1A3326] pb-6 mb-6">
              <div>
                <h3 className="font-semibold text-xl text-white">{user.firstName} {user.lastName}</h3>
                <p className="text-sm text-gray-400 mt-1">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="bg-[#1A3326] text-gray-300 px-3 py-1 rounded-md uppercase tracking-wider">{user.role}</span>
                <span className={`px-3 py-1 rounded-md uppercase tracking-wider ${user.status === 'ACTIVE' ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-red-500/10 text-red-400'}`}>{user.status}</span>
                <span className="bg-[#00E676]/10 text-[#00E676] px-3 py-1 rounded-md uppercase tracking-wider">Affiliate: {user.affiliateStatus}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6 text-sm">
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">User ID</div>
                <div className="text-gray-300 break-all font-mono text-xs">{user._id}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Phone</div>
                <div className="text-gray-300">{user.phone || user.contact?.phone || user.customerDetails?.phone || "—"}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Country</div>
                <div className="text-gray-300">{user.country || user.contact?.country || user.customerDetails?.country || "—"}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Email Verified</div>
                <div className={`font-medium ${user.emailVerified ? 'text-[#00E676]' : 'text-red-400'}`}>{user.emailVerified ? "Yes" : "No"}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Referral Code</div>
                <div className="text-gray-300">{user.referralCode || "—"}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Referred By</div>
                <div className="text-gray-300">{user.referredBy || user.referredByName || "—"}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Joined</div>
                <div className="text-gray-300">{new Date(user.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Last Updated</div>
                <div className="text-gray-300">{new Date(user.updatedAt).toLocaleString()}</div>
              </div>
            </div>

            {user.address && Object.values(user.address).some(Boolean) && (
              <div className="border-t border-[#1A3326] mt-6 pt-4 text-sm">
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Address</div>
                <div className="text-gray-300">
                  {[user.address.street, user.address.apartment, user.address.city, user.address.county, user.address.postcode].filter(Boolean).join(", ")}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MAIN LAYOUT ---

export default function AdminDashboard() {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  const navItems = [
    ["", "Overview", "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"],
    ["users", "All Users", "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"],
    ["orders", "Payment Reviews", "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"],
    ["payments", "Payment Methods", "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"],
    ["templates", "Pricing", "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"],
    ["affiliates", "Affiliates", "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"],
    ["withdrawals", "Withdrawals", "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"],
    ["affiliate-users", "Affiliate Users", "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"],
  ];

  return (
    <div className="min-h-screen bg-[#050A08] text-white flex flex-col md:flex-row font-sans">
      <div className="flex items-center justify-between border-b border-[#1A3326] bg-[#0A0F0D] px-4 py-4 md:hidden">
        <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#00E676] rounded-full inline-block" />
          Admin Panel
        </h1>
        <button
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-expanded={mobileNavOpen}
          aria-label="Toggle admin navigation"
          className="rounded-lg border border-[#1A3326] p-2 text-[#00E676]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {mobileNavOpen ? <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></> : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}
          </svg>
        </button>
      </div>
      
      {/* Sidebar Navigation */}
      <aside className={`${mobileNavOpen ? "flex" : "hidden"} md:flex w-full md:w-64 shrink-0 bg-[#0A0F0D] border-b md:border-b-0 md:border-r border-[#1A3326] flex-col`}>
        <div className="hidden md:block p-6 border-b border-[#1A3326]">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-[#00E676] rounded-full inline-block"></span>
            Admin Panel
          </h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(([path, label, iconPath]) => {
            const isActive = location.pathname === `/admin/${path}` || (path === "" && location.pathname === "/admin");
            return (
              <Link 
                key={path} 
                to={`/admin/${path}`} 
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-[#00E676]/10 text-[#00E676]" 
                    : "text-gray-400 hover:bg-[#1A3326] hover:text-white"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={iconPath} />
                </svg>
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-10">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="users" element={<AllUsers />} />
            <Route path="orders" element={<OrdersReview />} />
            <Route path="payments" element={<PaymentMethods />} />
            <Route path="templates" element={<Templates />} />
            <Route path="affiliates" element={<AffiliateApplications />} />
            <Route path="withdrawals" element={<AffiliateWithdrawals />} />
            <Route path="affiliate-users" element={<AffiliateUsers />} />
          </Routes>
        </div>
      </main>
      
    </div>
  );
}