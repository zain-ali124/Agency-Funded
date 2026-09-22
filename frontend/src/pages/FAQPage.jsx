import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [open, setOpen] = useState(null);
  useEffect(() => { api.get("/cms/faqs").then(({ data }) => setFaqs(data.faqs)); }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold mb-10">Frequently Asked Questions</h1>
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div key={f._id} className="card p-5 cursor-pointer" onClick={() => setOpen(open === i ? null : i)}>
            <div className="flex justify-between items-center font-semibold">
              <span>{f.question}</span>
              <span className="text-brand">{open === i ? "−" : "+"}</span>
            </div>
            {open === i && <p className="text-textMuted text-sm mt-3">{f.answer}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
