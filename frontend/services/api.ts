import axios from "axios";
import { clearLocalAuth } from "./auth-storage";

const api = axios.create({
  // Same-origin Next rewrites keep the Laravel session/CSRF cookies host-only.
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
  // Axios's default adds X-XSRF-TOKEN only for same-origin requests.
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  let token: string | null = null;
  try { token = localStorage.getItem("auth_token"); } catch { /* Legacy storage is optional for sessions. */ }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const method = (config.method || "get").toLowerCase();
  if (!["get", "head", "options"].includes(method)) {
    const hasCsrfCookie = document.cookie.split(";").some((cookie) => cookie.trim().startsWith("XSRF-TOKEN="));
    if (!hasCsrfCookie) {
      await axios.get("/sanctum/csrf-cookie", { withCredentials: true });
    }
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearLocalAuth();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
