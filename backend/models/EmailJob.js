const mongoose = require("mongoose");

const emailJobSchema = new mongoose.Schema({
  to: { type: String, required: true },
  subject: { type: String, required: true },
  html: { type: String, required: true },
  text: String,
  status: { type: String, enum: ["PENDING", "PROCESSING", "SENT", "FAILED"], default: "PENDING" },
  attempts: { type: Number, default: 0 },
  runAt: { type: Date, default: Date.now },
  lockedAt: Date,
  sentAt: Date,
  lastError: String,
}, { timestamps: true });

emailJobSchema.index({ status: 1, runAt: 1, createdAt: 1 });
emailJobSchema.index({ status: 1, lockedAt: 1 });

module.exports = mongoose.models.EmailJob || mongoose.model("EmailJob", emailJobSchema);