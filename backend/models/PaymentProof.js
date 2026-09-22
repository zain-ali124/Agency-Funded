const mongoose = require("mongoose");

const paymentProofSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    fileUrl: { type: String, required: true },
    fileName: String,
    mimeType: String,
    fileSize: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentProof", paymentProofSchema);
