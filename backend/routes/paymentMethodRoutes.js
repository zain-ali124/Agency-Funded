const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/paymentMethodController");
const { protect } = require("../middleware/auth");
const { requireAnyAdmin } = require("../middleware/roles");

router.get("/", ctrl.listPaymentMethods);
router.get("/admin", protect, requireAnyAdmin, ctrl.adminListPaymentMethods);
router.post("/", protect, requireAnyAdmin, ctrl.adminCreatePaymentMethod);
router.put("/:id", protect, requireAnyAdmin, ctrl.adminUpdatePaymentMethod);

module.exports = router;
