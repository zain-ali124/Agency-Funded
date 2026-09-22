const asyncHandler = require("../middleware/asyncHandler");
const FAQ = require("../models/FAQ");
const Testimonial = require("../models/Testimonial");

const listFaqs = asyncHandler(async (req, res) => {
  const faqs = await FAQ.find({ active: true }).sort({ category: 1, displayOrder: 1 });
  res.json({ success: true, faqs });
});

const adminListFaqs = asyncHandler(async (req, res) => {
  const faqs = await FAQ.find().sort({ category: 1, displayOrder: 1 });
  res.json({ success: true, faqs });
});

const adminCreateFaq = asyncHandler(async (req, res) => {
  const faq = await FAQ.create(req.body);
  res.status(201).json({ success: true, faq });
});

const adminUpdateFaq = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!faq) {
    res.status(404);
    throw new Error("FAQ not found");
  }
  res.json({ success: true, faq });
});

const adminDeleteFaq = asyncHandler(async (req, res) => {
  await FAQ.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "FAQ deleted" });
});

const listTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find({ active: true, verified: true }).sort({ createdAt: -1 });
  res.json({ success: true, testimonials });
});

const adminCreateTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.create(req.body);
  res.status(201).json({ success: true, testimonial });
});

const adminUpdateTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, testimonial });
});

module.exports = {
  listFaqs, adminListFaqs, adminCreateFaq, adminUpdateFaq, adminDeleteFaq,
  listTestimonials, adminCreateTestimonial, adminUpdateTestimonial,
};
