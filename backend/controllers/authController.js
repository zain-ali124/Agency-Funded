const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");
const Referral = require("../models/Referral");
const generateToken = require("../utils/generateToken");
const { generateReferralCode } = require("../utils/generateIds");

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone, country, referralCode } = req.body;

  if (!firstName || !lastName || !email || !password) {
    res.status(400);
    throw new Error("First name, last name, email and password are required");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await User.hashPassword(password);

  let referredBy = null;
  let affiliate = null;
  const normalizedReferralCode = referralCode?.trim().toUpperCase();
  if (referralCode) {
    affiliate = await User.findOne({ referralCode: normalizedReferralCode, affiliateStatus: "APPROVED" });
    if (affiliate) referredBy = affiliate._id;
  }

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    passwordHash,
    phone,
    country,
    referredBy,
  });

  if (referredBy) {
    const existingReferral = await Referral.findOneAndUpdate(
      {
        affiliate: referredBy,
        referralCode: normalizedReferralCode,
        registeredUser: null,
        createdAt: { $gte: new Date(Date.now() - Number(process.env.REFERRAL_ATTRIBUTION_DAYS || 30) * 86400000) },
      },
      { registeredUser: user._id },
      { sort: { createdAt: -1 }, new: true }
    );

    if (!existingReferral) {
      await Referral.create({
        affiliate: referredBy,
        referralCode: normalizedReferralCode,
        registeredUser: user._id,
        ip: req.ip,
      });
    }
  }

  const token = generateToken(user._id, user.role);
  res.cookie("token", token, cookieOptions());

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
    token,
  });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() }).select("+passwordHash");

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user._id, user.role);
  res.cookie("token", token, cookieOptions());

  res.json({
    success: true,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      affiliateStatus: user.affiliateStatus,
      referralCode: user.referralCode,
    },
    token,
  });
});

// @route POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out" });
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { register, login, logout, getMe };
