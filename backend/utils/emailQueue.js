const EmailJob = require("../models/EmailJob");

async function enqueueEmail({ to, subject, html, text }) {
  try {
    return await EmailJob.create({ to, subject, html, text });
  } catch (err) {
    console.warn("[email:queue-failed]", err.message);
    return null;
  }
}

module.exports = { enqueueEmail };