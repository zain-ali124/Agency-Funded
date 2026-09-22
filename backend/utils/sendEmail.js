const nodemailer = require("nodemailer");

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Central email sender. All PRD email templates (Section 92) route through here.
 * If SMTP isn't configured, logs instead of throwing so the rest of the flow
 * (order creation, approvals, etc.) never breaks because email is down.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`[email:skipped - no SMTP configured] to=${to} subject="${subject}"`);
    return { skipped: true };
  }
  try {
    const info = await getTransporter().sendMail({
      from: process.env.FROM_EMAIL || "no-reply@agencyfunded.com",
      to,
      subject,
      html,
      text,
    });
    return info;
  } catch (err) {
    console.error("sendEmail error:", err.message);
    return { error: err.message };
  }
}

const templates = {
  paymentUnderReview: (name) => ({
    subject: "Payment Under Review — Agency Funded",
    html: `<p>Hi ${name},</p><p>Your payment proof has been received and is currently under review by the Agency Funded team. You will receive another email once your order has been approved or if additional information is required.</p>`,
  }),
  paymentApproved: (name, orderId) => ({
    subject: "Payment Approved — Agency Funded",
    html: `<p>Hi ${name},</p><p>Your payment for order ${orderId} has been approved. Your trading account is being created now.</p>`,
  }),
  paymentRejected: (name, reason) => ({
    subject: "Payment Could Not Be Verified — Agency Funded",
    html: `<p>Hi ${name},</p><p>We were unable to verify your payment. Reason: ${reason || "N/A"}. Please contact support or resubmit your proof.</p>`,
  }),
  accountActivated: (name, account) => ({
    subject: "Your Agency Funded Account Is Active",
    html: `<p>Hi ${name},</p><p>Your ${account.accountSize / 1000}K ${account.model} account (${account.accountNumber}) is now active. Log in to your dashboard to view your credentials and trading rules.</p>`,
  }),
  affiliateApplicationReceived: (name) => ({
    subject: "Affiliate Application Received — Agency Funded",
    html: `<p>Hi ${name},</p><p>We've received your affiliate application. We'll notify you once it has been reviewed.</p>`,
  }),
  affiliateApproved: (name, referralCode) => ({
    subject: "You're an Agency Funded Affiliate!",
    html: `<p>Hi ${name},</p><p>Your affiliate application has been approved. Your referral code is <b>${referralCode}</b>.</p>`,
  }),
  commissionReceived: (name, amount) => ({
    subject: "New Commission Earned — Agency Funded",
    html: `<p>Hi ${name},</p><p>You've earned a new commission of $${amount}.</p>`,
  }),
  payoutPaid: (name, amount) => ({
    subject: "Payout Completed — Agency Funded",
    html: `<p>Hi ${name},</p><p>Your payout of $${amount} has been completed.</p>`,
  }),
};

module.exports = { sendEmail, templates };
