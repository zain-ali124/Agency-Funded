const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/affiliateController");
const { protect } = require("../middleware/auth");
const { requireAnyAdmin } = require("../middleware/roles");

router.post("/apply", protect, ctrl.applyForAffiliate);
router.post("/track/:code", ctrl.trackClick);
router.get("/dashboard", protect, ctrl.getAffiliateDashboard);
router.post("/withdraw", protect, ctrl.requestWithdrawal);

// admin
router.get("/admin/applications", protect, requireAnyAdmin, ctrl.adminListApplications);
router.put("/admin/applications/:id", protect, requireAnyAdmin, ctrl.adminReviewApplication);
router.get("/admin/commissions", protect, requireAnyAdmin, ctrl.adminListCommissions);
router.put("/admin/commissions/:id", protect, requireAnyAdmin, ctrl.adminUpdateCommissionStatus);
router.get("/admin/withdrawals", protect, requireAnyAdmin, ctrl.adminListWithdrawals);
router.put("/admin/withdrawals/:id", protect, requireAnyAdmin, ctrl.adminProcessWithdrawal);
router.get("/admin/users", protect, requireAnyAdmin, ctrl.adminListAffiliateUsers);

module.exports = router;
