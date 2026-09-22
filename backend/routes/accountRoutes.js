const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/accountController");
const { protect } = require("../middleware/auth");

router.get("/mine", protect, ctrl.getMyAccounts);
router.get("/:id", protect, ctrl.getAccount);

module.exports = router;
