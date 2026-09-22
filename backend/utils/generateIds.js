const { customAlphabet } = require("nanoid");
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const nanoid = customAlphabet(alphabet, 8);

const generateOrderId = () => `ORD-${nanoid()}`;
const generateAccountNumber = () => `AF-${nanoid()}`;
const generateReferralCode = (firstName = "USER") =>
  `${firstName.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "USER"}${nanoid().slice(0, 4)}`;

module.exports = { generateOrderId, generateAccountNumber, generateReferralCode };
