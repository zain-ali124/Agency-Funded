const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/accountTemplateController");
const { protect } = require("../middleware/auth");
const { requireAnyAdmin } = require("../middleware/roles");

// Public catalog
router.get("/templates", ctrl.listTemplates);
router.get("/templates/:id", ctrl.getTemplate);
router.get("/categories", ctrl.listCategories);

// Admin management
router.post("/templates", protect, requireAnyAdmin, ctrl.createTemplate);
router.put("/templates/:id", protect, requireAnyAdmin, ctrl.updateTemplate);
router.delete("/templates/:id", protect, requireAnyAdmin, ctrl.deleteTemplate);
router.post("/categories", protect, requireAnyAdmin, ctrl.createCategory);
router.put("/categories/:id", protect, requireAnyAdmin, ctrl.updateCategory);

module.exports = router;
