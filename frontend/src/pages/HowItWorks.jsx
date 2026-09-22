import React from "react";

const steps = [
  ["01", "Choose Account", "Select Instant, 1-Step or 3-Step and your account size."],
  ["02", "Complete Payment", "Pay via bank transfer, JazzCash, Easypaisa or crypto."],
  ["03", "Upload Payment Proof", "Attach your receipt or screenshot for manual verification."],
  ["04", "Get Funded", "Once approved, receive your credentials and start trading."],
];

export default function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold mb-10">How It Works</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map(([n, t, d]) => (
          <div key={n} className="card p-6">
            <div className="text-brand font-extrabold text-2xl mb-2">{n}</div>
            <div className="font-semibold mb-2">{t}</div>
            <div className="text-textMuted text-sm">{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
