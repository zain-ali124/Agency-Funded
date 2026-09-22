import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import AccountCard from "../components/AccountCard";

const MODELS = [
  { key: "", label: "All" },
  { key: "INSTANT", label: "Instant" },
  { key: "ONE_STEP", label: "1 Step" },
  { key: "THREE_STEP", label: "3 Step" },
];

export default function Accounts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const model = searchParams.get("model") || "";
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/accounts-catalog/templates", { params: model ? { model } : {} })
      .then(({ data }) => setTemplates(data.templates))
      .finally(() => setLoading(false));
  }, [model]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold mb-2">Choose Your Account</h1>
      <p className="text-textSecondary mb-8">Instant funding or evaluation-based — pick the model that fits how you trade.</p>

      <div className="flex gap-3 mb-10">
        {MODELS.map((m) => (
          <button
            key={m.key}
            onClick={() => setSearchParams(m.key ? { model: m.key } : {})}
            className={`px-5 py-2 rounded-sm border text-sm font-semibold transition-colors ${
              model === m.key ? "border-brand text-brand bg-brand/5" : "border-borderDark text-textSecondary hover:border-textMuted"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-textMuted">Loading accounts…</p>
      ) : templates.length === 0 ? (
        <p className="text-textMuted">No active accounts in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((t) => <AccountCard key={t._id} template={t} />)}
        </div>
      )}
    </div>
  );
}
