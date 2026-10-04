import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD
  ? "https://server.agencyfunded.com/api"
  : "/api");

export const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("agency_funded_token");
  const isPublicCatalogRead = config.method === "get"
    && config.url?.startsWith("/accounts-catalog/")
    && config.params?.admin !== true;
  if (token && !isPublicCatalogRead) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
