# Agency Funded — MERN Prop Trading Platform

A database-driven funded-trading platform (MongoDB, Express, React, Node) built from the Agency Funded PRD.

## What's included in this build

**Backend (complete, runnable):**
- Auth (JWT via HTTP-only cookie) with RBAC (`CUSTOMER`, `AFFILIATE`, `ADMIN`, `SUPER_ADMIN`, `FINANCE_ADMIN`, `TRADING_ADMIN`, `CONTENT_ADMIN`, `AFFILIATE_ADMIN`, `SUPPORT_ADMIN`)
- 17 Mongoose models covering categories, admin-editable account templates, purchased accounts with immutable rule snapshots + per-account overrides, orders, coupons, payment methods/proofs, affiliates/referrals/commissions/withdrawals, payouts, audit logs, FAQs, testimonials
- Centralized **Formula Engine** (`utils/formulaEngine.js`) — profit target, overall/daily loss, drawdown floors, consistency %, profit share, and the **Discount Priority Engine** (referral beats coupon, never stack, PRD §110/36)
- Full checkout flow: quote → create order → upload payment proof → admin approve/reject → automatic trading-account creation with rule snapshot → email
- Affiliate flow: apply → admin approve → referral link/click tracking → 40% referral discount / 40% commission (computed off original price) → withdrawals
- Admin: dashboard metrics, order/payment review, account template & pricing editor, per-account trading-stats editor with overrides, audit log, affiliate application/commission/withdrawal management
- Seed script with your **exact PRD pricing** (Instant $100/$160, 1-Step $50/$70/$140/$300/$500; 3-Step left inactive/admin-configurable since no price was supplied)
- Security: bcrypt password hashing, HTTP-only cookies, helmet, mongo-sanitize, xss-clean, rate limiting, multer file-type/size validation, full audit logging on every rule/price/status change

**Frontend (complete, builds cleanly with `npm run build`):**
- React + Vite + Tailwind, using the exact dark/green design system from your UI spec (`#050505` bg, `#00E676` accent, Inter font, card/border tokens)
- Public: Home, Accounts catalog (model filter), Account Detail, How It Works, Trading Rules (auto-generated from live templates), FAQ
- Auth: Login, Register (with referral-code capture from `?ref=`)
- Checkout: live price quote, coupon field, referral auto-apply (coupon disabled when referral active — enforces the no-stack rule), payment method selection, payment-proof upload
- Customer Dashboard: per-account balance/equity/profit/loss with progress bars for profit target, daily loss and overall loss
- Affiliate: apply form → pending state → full affiliate dashboard (clicks, referrals, commissions, referral link) once approved
- Admin: metrics overview, payment-proof review queue (approve/reject), live pricing editor, affiliate application review

## What's intentionally NOT built in this pass
Given the PRD's ~150 sections, this build covers the full data model and every core money-flow end-to-end rather than every marketing/legal page and admin screen listed in the doc (e.g. blog CMS, full legal-page set, KYC, support tickets, notification center UI, detailed analytics charts). The architecture (models, RBAC, audit logging, formula engine) is built to extend into all of those without rework — happy to keep building out specific sections next.

## Running it locally

### Backend
```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, SMTP (optional)
npm install
npm run seed            # creates categories, templates, payment methods, FAQs, and a SUPER_ADMIN
npm run dev              # http://localhost:5000
```
Seeded admin login: `admin@agencyfunded.com` / `ChangeMe123!` — **change this immediately**.

### Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173 (proxies /api to :5000)
```

## Key architectural decisions (per your PRD)
- **Admin → Database → Website**: every price/rule lives in `AccountTemplate` and is edited via `/admin/templates` — no hard-coded values in the UI.
- **Rule Snapshot** (§52): on approval, `Account.ruleSnapshot` freezes the template's rules at that moment; later template edits never retroactively change existing customer accounts.
- **Per-account overrides** (§51/113): `Account.overrides` layers on top of the snapshot for one customer only, fully audit-logged.
- **Discount Priority Engine** (§110): implemented once in `formulaEngine.computeOrderPricing` and reused by both the quote and order-creation endpoints so pricing can never drift between preview and checkout.
