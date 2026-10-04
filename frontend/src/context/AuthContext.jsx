import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);
const LEGACY_TOKEN_KEY = "agency_funded_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Authentication now uses the HTTP-only cookie set by the API.
    // Remove any bearer token saved by older frontend builds.
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    refreshUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      setUser(null);
    }
  };

  const isAdmin = user && user.role && user.role.includes("ADMIN");

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
