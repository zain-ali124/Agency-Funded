import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Top Header (Minimalist) */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 sm:h-24 flex items-center justify-between">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-[#00E676] rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#050A08" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-bold tracking-[0.12em] text-sm text-white">AGENCY <span className="text-[#00E676]">FUNDED</span></span>
          </Link>

          {/* Auth / User Section */}
          <div className="flex items-center gap-6">
            {user ? (
              <>
                {isAdmin ? (
                  <Link to="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">Admin</Link>
                ) : (
                  <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
                )}
                <button
                  onClick={async () => { await logout(); navigate("/"); }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] sm:w-auto max-w-fit px-0 sm:px-4">
        <div className="bg-[#0A0F0D] border border-[#1A1F1D] rounded-full p-1.5 flex items-center gap-1 shadow-[0_0_30px_rgba(0,230,118,0.1)] overflow-visible">
          
          {/* Left Logo Icon */}
          <Link
            to="/"
            aria-label="Go to homepage"
            title="Homepage"
            className="w-10 h-10 bg-[#00E676] rounded-full flex items-center justify-center shrink-0 ml-1 hover:bg-[#00c853] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#050A08" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              <path d="M2 12h20"/>
            </svg>
          </Link>

          {/* Desktop navigation links */}
          <div className="hidden md:flex items-center px-2 md:px-6 gap-3 md:gap-6 shrink-0">
            {[
              ["Accounts", "/accounts"],
              ["How It Works", "/how-it-works"],
              ["Rules", "/rules"],
              ["Affiliate", "/affiliate"],
              ["FAQ", "/faq"],
            ].map(([label, path]) => (
              <Link 
                key={path}
                to={path}
                className="text-xs md:text-sm font-medium whitespace-nowrap transition-colors px-3 py-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Mobile navigation */}
          <div className="relative md:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label="Toggle navigation menu"
              className="w-10 h-10 rounded-full border border-[#2A2F2D] bg-[#1A1F1D] text-[#00E676] flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></> : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute bottom-14 right-0 z-[60] w-48 rounded-2xl border border-[#1A3326] bg-[#0A0F0D] p-2 shadow-[0_0_30px_rgba(0,230,118,0.12)]">
                {[
                  ["Accounts", "/accounts"],
                  ["How It Works", "/how-it-works"],
                  ["Rules", "/rules"],
                  ["Affiliate", "/affiliate"],
                  ["FAQ", "/faq"],
                ].map(([label, path]) => (
                  <Link key={path} to={path} onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-[#00E676]/10 hover:text-[#00E676]">
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Dashboard shortcut */}
          <Link
            to={user ? (isAdmin ? "/admin" : "/dashboard") : "/login"}
            aria-label={user ? (isAdmin ? "Open admin dashboard" : "Open dashboard") : "Sign in to open dashboard"}
            title={user ? (isAdmin ? "Admin dashboard" : "Dashboard") : "Sign in"}
            className="w-10 h-10 bg-[#1A1F1D] rounded-full flex items-center justify-center shrink-0 mr-1 border border-[#2A2F2D] hover:border-[#00E676] transition-colors"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#00E676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  );
}