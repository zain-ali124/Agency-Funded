const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/payoutController");
const { protect } = require("../middleware/auth");
const { requireAnyAdmin } = require("../middleware/roles");

router.post("/request", protect, ctrl.requestPayout);
router.get("/mine", protect, ctrl.getMyPayouts);
router.get("/admin", protect, requireAnyAdmin, ctrl.adminListPayouts);
router.put("/admin/:id", protect, requireAnyAdmin, ctrl.adminProcessPayout);

module.exports = router;
