const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/orderController");
const { protect, optionalAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.post("/quote", optionalAuth, ctrl.quoteOrder);
router.post("/", optionalAuth, ctrl.createOrder);
router.get("/mine", protect, ctrl.getMyOrders);
router.get("/:orderId", optionalAuth, ctrl.getOrder);
router.post("/:orderId/payment-proof", optionalAuth, upload.single("proof"), ctrl.uploadPaymentProof);

module.exports = router;
