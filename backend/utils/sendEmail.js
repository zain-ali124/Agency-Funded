const nodemailer = require("nodemailer");

let transporter;
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
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
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[email:skipped - no SMTP configured] to=${to} subject="${subject}"`);
    return { skipped: true };
  }
  try {
    console.log(`[email:sending] to=${to} subject="${subject}"`);
    const info = await getTransporter().sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
    return info;
  } catch (err) {
    console.error("sendEmail error:", err.code || "unknown", err.message);
    return { error: err.message };
  }
}

const templates = {
  orderReceived: (name, orderId) => ({
    subject: "Order Received — Agency Funded",
    html: `<p>Hi ${name},</p><p>We have received your order ${orderId}. Please complete your payment and upload your payment proof from the checkout page so our team can review it.</p>`,
  }),
  paymentUnderReview: (name) => ({
    subject: "Payment Review Request Received — Agency Funded",
    html: `<p>Hi ${name},</p><p>Your payment review request has been received. Our team is reviewing your request now. Within 24 hours, or after the review is complete, we will send you a confirmation email with your funded account details.</p><p>Please keep your Agency Funded login email and the password you created at checkout available for signing in.</p>`,
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
    html: `<p>Hi ${name},</p><p>Your ${account.accountSize / 1000}K ${account.model} account (${account.accountNumber}) is now active.</p><p>Log in with the email address and password you created at checkout to access your funded account and trading rules.</p>`,
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
