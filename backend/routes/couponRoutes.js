const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/couponController");
const { protect } = require("../middleware/auth");
const { requireAnyAdmin } = require("../middleware/roles");

router.get("/validate/:code", ctrl.validateCoupon);
router.get("/", protect, requireAnyAdmin, ctrl.adminListCoupons);
router.post("/", protect, requireAnyAdmin, ctrl.adminCreateCoupon);
router.put("/:id", protect, requireAnyAdmin, ctrl.adminUpdateCoupon);
router.get("/:id/analytics", protect, requireAnyAdmin, ctrl.adminCouponAnalytics);

module.exports = router;
