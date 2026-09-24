import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-bgSecondary border-t border-borderDark mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <div className="font-extrabold text-lg mb-2">AGENCY <span className="text-brand">FUNDED</span></div>
          <p className="text-textMuted text-sm max-w-xs">Trade with capital. Keep your profits. Transparent, database-driven funded trading accounts.</p>
        </div>
        <div>
          <div className="label-muted mb-3">Accounts</div>
          <ul className="space-y-2 text-sm text-textSecondary">
            <li><Link to="/accounts?model=INSTANT" className="hover:text-white">Instant</Link></li>
            <li><Link to="/accounts?model=ONE_STEP" className="hover:text-white">2 Step</Link></li>
          </ul>
        </div>
        <div>
          <div className="label-muted mb-3">Resources</div>
          <ul className="space-y-2 text-sm text-textSecondary">
            <li><Link to="/how-it-works" className="hover:text-white">How It Works</Link></li>
            <li><Link to="/rules" className="hover:text-white">Trading Rules</Link></li>
            <li><Link to="/affiliate" className="hover:text-white">Affiliate</Link></li>
          </ul>
        </div>
        <div>
          <div className="label-muted mb-3">Legal</div>
          <ul className="space-y-2 text-sm text-textSecondary">
            <li><Link to="/terms" className="hover:text-white">Terms</Link></li>
            <li><Link to="/privacy" className="hover:text-white">Privacy</Link></li>
            <li><Link to="/risk-disclosure" className="hover:text-white">Risk Disclosure</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-borderDark px-6 pt-6 pb-28 md:pb-24 text-center text-textMuted text-xs">
        <p>© {new Date().getFullYear()} Agency Funded. All rights reserved.</p>
        <p className="mt-2">Developed by <span className="text-textPrimary font-medium">Zayn</span> · <a href="mailto:zaynalie05@gmail.com" className="hover:text-brand transition-colors">zaynalie05@gmail.com</a></p>
      </div>
    </footer>
  );
}
