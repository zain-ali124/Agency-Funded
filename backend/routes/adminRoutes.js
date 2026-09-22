const express = require("express");
const router = express.Router();
const orderCtrl = require("../controllers/orderController");
const accountCtrl = require("../controllers/accountController");
const adminCtrl = require("../controllers/adminController");
const { protect } = require("../middleware/auth");
const { requireAnyAdmin, requireSuperAdmin } = require("../middleware/roles");

router.use(protect, requireAnyAdmin);

router.get("/dashboard", adminCtrl.getDashboardMetrics);
router.get("/audit-logs", adminCtrl.getAuditLogs);
router.get("/users", adminCtrl.adminListUsers);
router.put("/users/:id/role", requireSuperAdmin, adminCtrl.adminUpdateUserRole);

router.get("/orders", orderCtrl.adminListOrders);
router.put("/orders/:orderId/approve", orderCtrl.adminApproveOrder);
router.put("/orders/:orderId/reject", orderCtrl.adminRejectOrder);

router.get("/accounts", accountCtrl.adminListAccounts);
router.put("/accounts/:id/stats", accountCtrl.adminUpdateAccountStats);
router.put("/accounts/:id/override", accountCtrl.adminOverrideAccountRule);

module.exports = router;
