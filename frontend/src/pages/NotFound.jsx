import React from "react";
import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-6 py-32 text-center">
      <h1 className="text-4xl font-extrabold mb-4">404</h1>
      <p className="text-textMuted mb-8">Page not found.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  );
}
