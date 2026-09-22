import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import AccountCard from "../components/AccountCard";
import Header from "../components/Header";

export default function Home() {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    api.get("/accounts-catalog/templates").then(({ data }) => setTemplates(data.templates.slice(0, 4)));
  }, []);

  return (
    <div className="bg-[#050A08] min-h-screen text-white font-sans relative overflow-hidden">
      <Header />
      
      {/* Background Chart Lines */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Left chart line */}
          <path d="M-50 600 L100 550 L200 620 L300 500 L400 580 L500 450 L600 520 L700 400" stroke="#00E676" strokeWidth="2" fill="none" />
          {/* Right chart line */}
          <path d="M700 400 L800 500 L900 380 L1000 480 L1100 350 L1200 450 L1300 300 L1500 400" stroke="#00E676" strokeWidth="2" fill="none" />
          {/* Subtle grid lines */}
          <line x1="0" y1="200" x2="1440" y2="200" stroke="#1A3326" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="400" x2="1440" y2="400" stroke="#1A3326" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="600" x2="1440" y2="600" stroke="#1A3326" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* Hero Section */}
      <main className="hero-stage relative z-10 flex flex-col items-center justify-center pt-24 pb-28 sm:pb-40 px-4 text-center">
        <div className="hero-glow hero-glow-primary" aria-hidden="true" />
        <div className="hero-glow hero-glow-secondary" aria-hidden="true" />
        <div className="hero-horizon" aria-hidden="true" />
        <div className="hero-icon hero-icon-growth" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 17l5-5 3 3 7-8" /><path d="M15 7h4v4" /></svg>
        </div>
        <div className="hero-icon hero-icon-shield" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
        </div>
        <div className="hero-icon hero-icon-capital" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" /><path d="M12 7v10M15 9.5c-.7-.7-1.7-1-3-1-1.5 0-2.5.7-2.5 1.8 0 2.8 5.5 1 5.5 3.8 0 1.2-1 1.9-2.8 1.9-1.3 0-2.4-.4-3.2-1.2" /></svg>
        </div>
        <div className="hero-icon hero-icon-target" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3" /></svg>
        </div>
        {/* Pill Badge */}
        <div className="relative z-10 inline-flex items-center gap-2 bg-[#0A1C14]/80 border border-[#1A3326] text-[#00E676] px-4 py-1.5 rounded-full text-sm font-medium mb-8 shadow-[0_0_24px_rgba(0,230,118,0.08)]">
          <span className="hero-pulse" /> Trade with backed confidence
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.1] max-w-4xl tracking-tight text-white">
          Trade your edge. <br className="hidden md:block" />
          <span className="text-[#00E676]">Keep your upside.</span>
        </h1>

        {/* Subheading */}
        <p className="text-gray-400 mt-6 max-w-2xl text-base md:text-lg leading-relaxed">
          Access serious buying power, clear trading rules, and a transparent path from evaluation to payout.
        </p>

        {/* CTA Button */}
        <Link 
          to="/accounts" 
          className="mt-10 bg-[#00E676] text-[#050A08] font-semibold px-8 py-4 rounded-full flex items-center gap-2 hover:bg-[#00c853] transition-all duration-300 transform hover:scale-105"
        >
          Explore funded accounts <span className="text-xl leading-none">→</span>
        </Link>
      </main>

      {/* Featured Accounts Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 border-t border-[#1A3326]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-[#00E676] text-xs font-semibold uppercase tracking-[0.2em] mb-3">Capital built around you</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Choose your account.</h2>
            <p className="text-gray-400 mt-3 max-w-xl">Clear parameters, transparent pricing, and room to trade the strategy you trust.</p>
          </div>
          <Link to="/accounts" className="text-sm text-[#00E676] hover:text-white transition-colors whitespace-nowrap">Compare all accounts →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 max-w-2xl">
          {[['$100K', 'Maximum allocation'], ['80%', 'Profit split'], ['0', 'Hidden rules']].map(([value, label]) => (
            <div key={label} className="border-l-2 border-[#00E676] pl-4 py-1">
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {templates.map((t) => (
            <div key={t._id} className="bg-[#0A0F0D] border border-[#1A3326] rounded-2xl p-1 hover:border-[#00E676] hover:-translate-y-1 transition-all duration-300">
              <AccountCard template={t} />
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/accounts" className="inline-block border border-[#1A3326] text-white hover:border-[#00E676] hover:text-[#00E676] px-8 py-3 rounded-full font-medium transition-colors">
            View all account plans
          </Link>
        </div>
      </section>

      {/* How it works Section (Styled for Dark Mode) */}
      <section className="relative z-10 bg-[#0A0F0D] border-y border-[#1A3326] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold mb-12 text-center text-white">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              ["01", "Choose Account", "Pick a model and account size that fits your strategy."],
              ["02", "Complete Payment", "Pay via your preferred method and upload proof."],
              ["03", "Verification", "Our team manually verifies your payment."],
              ["04", "Get Funded", "Receive your credentials and start trading."],
            ].map(([n, t, d]) => (
              <div key={n} className="bg-[#050A08] border border-[#1A3326] rounded-2xl p-6 hover:border-[#00E676] transition-colors">
                <div className="text-[#00E676] font-extrabold text-xl mb-3">{n}</div>
                <div className="font-semibold mb-2 text-white">{t}</div>
                <div className="text-gray-400 text-sm leading-relaxed">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}