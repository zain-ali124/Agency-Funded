require("dotenv").config();

const connectDB = require("../config/db");
const EmailJob = require("../models/EmailJob");
const { sendEmail } = require("../utils/sendEmail");

const POLL_INTERVAL_MS = 1000;
const LOCK_TIMEOUT_MS = 60000;
const MAX_ATTEMPTS = 8;
const BASE_RETRY_DELAY_MS = 5000;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function claimNextJob() {
  const now = new Date();
  const expiredLock = new Date(now.getTime() - LOCK_TIMEOUT_MS);
  return EmailJob.findOneAndUpdate(
    {
      $or: [
        { status: "PENDING", runAt: { $lte: now } },
        { status: "PROCESSING", lockedAt: { $lte: expiredLock } },
      ],
    },
    { $set: { status: "PROCESSING", lockedAt: now }, $inc: { attempts: 1 } },
    { new: true, sort: { createdAt: 1 } }
  );
}

async function processNextJob() {
  const job = await claimNextJob();
  if (!job) return false;

  try {
    const result = await sendEmail(job);
    if (result.error || result.skipped) {
      throw new Error(result.error || "SMTP is not configured");
    }
    await EmailJob.updateOne(
      { _id: job._id, status: "PROCESSING" },
      { $set: { status: "SENT", sentAt: new Date(), lockedAt: null, lastError: null } }
    );
    console.log(`[email:sent] job=${job._id}`);
  } catch (err) {
    const failed = job.attempts >= MAX_ATTEMPTS;
    const retryDelay = Math.min(BASE_RETRY_DELAY_MS * (2 ** (job.attempts - 1)), MAX_RETRY_DELAY_MS);
    await EmailJob.updateOne(
      { _id: job._id, status: "PROCESSING" },
      {
        $set: {
          status: failed ? "FAILED" : "PENDING",
          runAt: new Date(Date.now() + retryDelay),
          lockedAt: null,
          lastError: err.message,
        },
      }
    );
    console.warn(`[email:${failed ? "permanently-failed" : "retry-scheduled"}] job=${job._id} attempt=${job.attempts} error=${err.message}`);
  }

  return true;
}

async function startWorker() {
  await connectDB();
  console.log("Email worker started");

  while (true) {
    try {
      const processed = await processNextJob();
      if (!processed) await wait(POLL_INTERVAL_MS);
    } catch (err) {
      console.warn("[email:worker-error]", err.message);
      await wait(POLL_INTERVAL_MS);
    }
  }
}

startWorker().catch((err) => {
  console.error("Email worker failed to start:", err.message);
  process.exitCode = 1;
});