const asyncHandler = require("../middleware/asyncHandler");
const PaymentMethod = require("../models/PaymentMethod");

const listPaymentMethods = asyncHandler(async (req, res) => {
  const methods = await PaymentMethod.find({ active: true }).sort({ displayOrder: 1 });
  res.json({ success: true, methods });
});

const adminListPaymentMethods = asyncHandler(async (req, res) => {
  const methods = await PaymentMethod.find().sort({ displayOrder: 1 });
  res.json({ success: true, methods });
});

const adminCreatePaymentMethod = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.create(req.body);
  res.status(201).json({ success: true, method });
});

const adminUpdatePaymentMethod = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!method) {
    res.status(404);
    throw new Error("Payment method not found");
  }
  res.json({ success: true, method });
});

module.exports = { listPaymentMethods, adminListPaymentMethods, adminCreatePaymentMethod, adminUpdatePaymentMethod };
