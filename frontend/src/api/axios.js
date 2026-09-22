import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD
  ? "https://agency-funded.onrender.com/api"
  : "/api");

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

export default api;
