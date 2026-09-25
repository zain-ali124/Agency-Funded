import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Checkout() {
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [template, setTemplate] = useState(null);
  const [methods, setMethods] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [referralCode] = useState(searchParams.get("ref") || localStorage.getItem("af_ref") || "");
  const [pricing, setPricing] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [details, setDetails] = useState({
    firstName: user?.firstName || "", lastName: user?.lastName || "", email: user?.email || "",
    country: "", streetAddress: "", apartment: "", city: "", county: "", postcode: "", phone: "",
  });
  const [guestEmail, setGuestEmail] = useState("");
  const [password, setPassword] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [order, setOrder] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [step, setStep] = useState("details"); // details -> pending -> submitted
  const [error, setError] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);

  useEffect(() => {
    api.get(`/accounts-catalog/templates/${templateId}`).then(({ data }) => setTemplate(data.template));
    api.get("/payment-methods").then(({ data }) => setMethods(data.methods));
  }, [templateId]);

  useEffect(() => {
    if (!template) return;
    api.post("/orders/quote", { templateId, couponCode, referralCode })
      .then(({ data }) => { setPricing(data.pricing); setCouponError(data.couponError || ""); });
  }, [template, couponCode, referralCode]);

  const submitOrder = async (e) => {
    e.preventDefault();
    setError("");
    if (!termsAccepted) { setError("Please accept the Terms & Conditions to continue."); return; }
    setSubmittingOrder(true);
    try {
      const { data } = await api.post("/orders", {
        templateId, couponCode, referralCode, paymentMethodId,
        customerDetails: { ...details, email: user ? user.email : guestEmail },
        guestEmail: user ? undefined : guestEmail,
        password: user ? undefined : password,
        termsAccepted: true, termsVersion: "v1",
      });
      if (data.token) {
        localStorage.setItem("agency_funded_token", data.token);
        await refreshUser();
      }
      setOrder(data.order);
      setStep("pending");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create order");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const submitProof = async (e) => {
    e.preventDefault();
    if (!proofFile) { setError("Please attach your payment proof."); return; }
    const form = new FormData();
    form.append("proof", proofFile);
    setUploadingProof(true);
    setError("");
    try {
      await api.post(`/orders/${order.orderId}/payment-proof`, form, { headers: { "Content-Type": "multipart/form-data" } });
      setStep("submitted");
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploadingProof(false);
    }
  };

  if (!template || !pricing) return <div className="max-w-4xl mx-auto px-6 py-24 text-textMuted">Loading…</div>;

  if (step === "submitted") {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-extrabold mb-3 text-brand">Payment Under Review</h1>
        <p className="text-textSecondary mb-8">We've received your payment proof for order <b>{order.orderId}</b>. You'll get an email once it's approved and your account is activated.</p>
        <button className="btn-primary" onClick={() => navigate(user ? "/dashboard" : "/")}>{user ? "Go to Dashboard" : "Back to Home"}</button>
      </div>
    );
  }

  if (step === "pending") {
    const method = methods.find((m) => m._id === paymentMethodId);
    return (
      <div className="max-w-lg mx-auto px-6 py-24">
        <h1 className="text-2xl font-extrabold mb-2">Upload Payment Proof</h1>
        <p className="text-textMuted mb-6">Order {order.orderId} — pay <b className="text-brand">${order.finalPrice}</b> via {method?.methodName}.</p>
        {method && (
          <div className="card p-5 mb-6 text-sm text-textSecondary space-y-1">
            {method.accountName && <div>Account Name: <span className="text-white">{method.accountName}</span></div>}
            {method.accountNumber && <div>Account Number: <span className="text-white">{method.accountNumber}</span></div>}
            {method.walletAddress && <div>Wallet Address: <span className="text-white">{method.walletAddress}</span></div>}
            {method.instructions && <div className="pt-2">{method.instructions}</div>}
          </div>
        )}
        <form onSubmit={submitProof} className="card p-6 space-y-4">
          {error && <p className="text-danger text-sm">{error}</p>}
          <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setProofFile(e.target.files[0])} className="w-full text-sm" />
          <button disabled={uploadingProof} className="btn-primary w-full">{uploadingProof ? "Uploading..." : "Submit Payment Proof"}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10">
      <form onSubmit={submitOrder} className="space-y-4">
        <h1 className="text-2xl font-extrabold mb-2">Checkout</h1>
        {error && <p className="text-danger text-sm">{error}</p>}
        {!user && (
          <>
            <input required type="email" placeholder="Email" className="w-full bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
              value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
            <input required minLength={8} type="password" placeholder="Create a password (8+ characters)" className="w-full bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
              value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-textMuted">We'll create your customer account so you can track this order and access your funded account.</p>
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="First Name" className="bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
            value={details.firstName} onChange={(e) => setDetails({ ...details, firstName: e.target.value })} />
          <input required placeholder="Last Name" className="bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
            value={details.lastName} onChange={(e) => setDetails({ ...details, lastName: e.target.value })} />
        </div>
        <input required placeholder="Country / Region" className="w-full bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
          value={details.country} onChange={(e) => setDetails({ ...details, country: e.target.value })} />
        <input required placeholder="Street Address" className="w-full bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
          value={details.streetAddress} onChange={(e) => setDetails({ ...details, streetAddress: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="City" className="bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
            value={details.city} onChange={(e) => setDetails({ ...details, city: e.target.value })} />
          <input required placeholder="Postcode" className="bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
            value={details.postcode} onChange={(e) => setDetails({ ...details, postcode: e.target.value })} />
        </div>
        <input required placeholder="Phone Number" className="w-full bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
          value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} />

        <div>
          <p className="label-muted mb-2">Payment Method</p>
          <div className="grid grid-cols-2 gap-2">
            {methods.map((m) => (
              <button type="button" key={m._id} onClick={() => setPaymentMethodId(m._id)}
                className={`border rounded-sm px-4 py-3 text-sm text-left ${paymentMethodId === m._id ? "border-brand text-brand bg-brand/5" : "border-borderDark text-textSecondary"}`}>
                {m.methodName}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-textSecondary">
          <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1" />
          I agree to the Terms & Conditions, trading rules, payout policy and risk disclosure.
        </label>

        <button className="btn-primary w-full" disabled={!paymentMethodId || submittingOrder}>{submittingOrder ? "Processing..." : "Continue to Payment"}</button>
      </form>

      <div>
        <div className="card p-6 sticky top-24">
          <h2 className="font-bold mb-4">Order Summary</h2>
          <div className="text-sm text-textSecondary mb-4">{(template.accountSize / 1000).toFixed(0)}K {template.model.replace("_", "-")}</div>

          <div className="mb-4">
            <input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)}
              disabled={pricing.discountSource === "REFERRAL"}
              className="w-full bg-bgSecondary border border-borderDark rounded-sm px-4 py-2 text-sm disabled:opacity-50" />
            {couponError && <p className="text-warning text-xs mt-1">{couponError}</p>}
          </div>

          <div className="space-y-2 text-sm border-t border-borderDark pt-4">
            <div className="flex justify-between"><span className="text-textMuted">Original Price</span><span>${pricing.originalPrice}</span></div>
            {pricing.referralDiscount > 0 && (
              <div className="flex justify-between text-brand"><span>Referral Discount ({pricing.referralPercentage}%)</span><span>-${pricing.referralDiscount}</span></div>
            )}
            {pricing.couponDiscount > 0 && (
              <div className="flex justify-between text-brand"><span>Coupon Discount ({pricing.couponPercentage}%)</span><span>-${pricing.couponDiscount}</span></div>
            )}
            <div className="flex justify-between font-extrabold text-lg pt-2 border-t border-borderDark"><span>You Pay</span><span className="text-brand">${pricing.finalPrice}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
