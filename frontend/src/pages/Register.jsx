import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    referralCode: searchParams.get("ref") || localStorage.getItem("af_ref") || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <h1 className="text-2xl font-extrabold mb-8">Create Account</h1>
      <form onSubmit={onSubmit} className="card p-8 space-y-4">
        {error && <p className="text-danger text-sm">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="First Name" className="bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
            value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <input required placeholder="Last Name" className="bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
            value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </div>
        <input required type="email" placeholder="Email" className="w-full bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required type="password" placeholder="Password" className="w-full bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input placeholder="Referral Code (optional)" className="w-full bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
          value={form.referralCode} onChange={(e) => setForm({ ...form, referralCode: e.target.value })} />
        <button disabled={loading} className="btn-primary w-full">{loading ? "Creating…" : "Create Account"}</button>
        <p className="text-textMuted text-sm text-center">Already have an account? <Link to="/login" className="text-brand">Login</Link></p>
      </form>
    </div>
  );
}
