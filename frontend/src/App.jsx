import React, { useEffect } from "react";
import { Routes, Route, useLocation, useSearchParams, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Accounts from "./pages/Accounts";
import AccountDetail from "./pages/AccountDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import Affiliate from "./pages/Affiliate";
import AdminDashboard from "./pages/AdminDashboard";
import HowItWorks from "./pages/HowItWorks";
import Rules from "./pages/Rules";
import FAQPage from "./pages/FAQPage";
import NotFound from "./pages/NotFound";
import { useAuth } from "./context/AuthContext";
import api from "./api/axios";

function ReferralCapture() {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("af_ref", ref);
      let visitorId = localStorage.getItem("af_visitor");
      if (!visitorId) {
        visitorId = Math.random().toString(36).slice(2);
        localStorage.setItem("af_visitor", visitorId);
      }
      api.post(`/affiliate/track/${ref}`, { visitorId }).catch(() => {});
    }
  }, [searchParams]);
  return null;
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  return user && isAdmin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <ReferralCapture />
      {!location.pathname.startsWith("/admin") && location.pathname !== "/" && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/:id" element={<AccountDetail />} />
          <Route path="/checkout/:templateId" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/affiliate" element={<Affiliate />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!location.pathname.startsWith("/admin") && <Footer />}
    </div>
  );
}
