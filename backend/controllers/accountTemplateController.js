const asyncHandler = require("../middleware/asyncHandler");
const AccountTemplate = require("../models/AccountTemplate");
const AccountCategory = require("../models/AccountCategory");
const AuditLog = require("../models/AuditLog");

// PUBLIC: list active templates (catalog), optionally filtered by category/model
const listTemplates = asyncHandler(async (req, res) => {
  const { category, model, admin } = req.query;
  const filter = {};
  if (!admin) filter.active = true;
  if (category) filter.category = category;
  if (model) filter.model = model.toUpperCase();

  const templates = await AccountTemplate.find(filter)
    .populate("category", "name slug")
    .sort({ model: 1, accountSize: 1 });

  res.json({ success: true, templates });
});

const getTemplate = asyncHandler(async (req, res) => {
  const template = await AccountTemplate.findById(req.params.id).populate("category", "name slug");
  if (!template) {
    res.status(404);
    throw new Error("Account template not found");
  }
  res.json({ success: true, template });
});

// ADMIN: create/update a template. This is the "Admin Account Template Editor" (PRD Section 66)
const createTemplate = asyncHandler(async (req, res) => {
  const template = await AccountTemplate.create(req.body);
  await AuditLog.create({
    admin: req.user._id,
    action: "CREATE_ACCOUNT_TEMPLATE",
    targetType: "AccountTemplate",
    targetId: template._id,
    newValue: template.toObject(),
  });
  res.status(201).json({ success: true, template });
});

const updateTemplate = asyncHandler(async (req, res) => {
  const template = await AccountTemplate.findById(req.params.id);
  if (!template) {
    res.status(404);
    throw new Error("Account template not found");
  }
  const oldValue = template.toObject();
  Object.assign(template, req.body);
  await template.save();

  await AuditLog.create({
    admin: req.user._id,
    action: "UPDATE_ACCOUNT_TEMPLATE",
    targetType: "AccountTemplate",
    targetId: template._id,
    oldValue,
    newValue: template.toObject(),
    reason: req.body.reason,
  });

  res.json({ success: true, template });
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await AccountTemplate.findById(req.params.id);
  if (!template) {
    res.status(404);
    throw new Error("Account template not found");
  }
  template.active = false; // soft delete - never hard-delete a product customers may have purchased
  await template.save();
  await AuditLog.create({
    admin: req.user._id,
    action: "DEACTIVATE_ACCOUNT_TEMPLATE",
    targetType: "AccountTemplate",
    targetId: template._id,
  });
  res.json({ success: true, message: "Template deactivated" });
});

// Categories
const listCategories = asyncHandler(async (req, res) => {
  const categories = await AccountCategory.find({ active: true }).sort({ displayOrder: 1 });
  res.json({ success: true, categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await AccountCategory.create(req.body);
  res.status(201).json({ success: true, category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await AccountCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json({ success: true, category });
});

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  listCategories,
  createCategory,
  updateCategory,
};
