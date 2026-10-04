import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD
  ? "https://server.agencyfunded.com/api"
  : "/api");

export const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

export default api;
