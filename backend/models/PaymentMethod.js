const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema(
  {
    methodName: { type: String, required: true }, // "Bank Transfer", "JazzCash", "Easypaisa", "Crypto", "PayPal"
    accountName: String,
    accountNumber: String,
    iban: String,
    walletAddress: String,
    qrCodeUrl: String,
    instructions: String,
    minimumAmount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
