import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role.includes("ADMIN") ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <h1 className="text-2xl font-extrabold mb-8">Login</h1>
      <form onSubmit={onSubmit} className="card p-8 space-y-4">
        {error && <p className="text-danger text-sm">{error}</p>}
        <input required type="email" placeholder="Email" className="w-full bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required type="password" placeholder="Password" className="w-full bg-bgSecondary border border-borderDark rounded-sm px-4 py-3"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={loading} className="btn-primary w-full">{loading ? "Logging in…" : "Login"}</button>
        <p className="text-textMuted text-sm text-center">No account? <Link to="/register" className="text-brand">Create one</Link></p>
      </form>
    </div>
  );
}
