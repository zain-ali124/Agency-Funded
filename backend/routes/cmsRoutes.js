const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/cmsController");
const { protect } = require("../middleware/auth");
const { requireAnyAdmin } = require("../middleware/roles");

router.get("/faqs", ctrl.listFaqs);
router.get("/testimonials", ctrl.listTestimonials);

router.get("/admin/faqs", protect, requireAnyAdmin, ctrl.adminListFaqs);
router.post("/admin/faqs", protect, requireAnyAdmin, ctrl.adminCreateFaq);
router.put("/admin/faqs/:id", protect, requireAnyAdmin, ctrl.adminUpdateFaq);
router.delete("/admin/faqs/:id", protect, requireAnyAdmin, ctrl.adminDeleteFaq);

router.post("/admin/testimonials", protect, requireAnyAdmin, ctrl.adminCreateTestimonial);
router.put("/admin/testimonials/:id", protect, requireAnyAdmin, ctrl.adminUpdateTestimonial);

module.exports = router;
