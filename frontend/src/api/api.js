import axios from "axios";

export const AUTH_TOKEN_KEY = "phishguard.authToken";

const normalizeBaseUrl = (value) => (value || "").trim().replace(/\/+$/, "");

const isLocalAddress = (value) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value);
const isLoopbackHost = (value) => /^(localhost|127\.0\.0\.1)$/i.test(value || "");
const apiUrlForBrowserHost = (hostname) =>
  `http://${isLoopbackHost(hostname) ? "127.0.0.1" : hostname}:8000`;

export const resolveApiBaseUrl = () => {
  const configuredBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

  if (configuredBaseUrl) {
    if (
      import.meta.env.DEV &&
      typeof window !== "undefined" &&
      isLocalAddress(configuredBaseUrl) &&
      !isLoopbackHost(window.location.hostname)
    ) {
      return apiUrlForBrowserHost(window.location.hostname);
    }
    if (import.meta.env.PROD && isLocalAddress(configuredBaseUrl) && typeof window !== "undefined") {
      return window.location.origin;
    }
    return configuredBaseUrl;
  }

  if (typeof window === "undefined") {
    return "";
  }

  const { hostname, port, origin } = window.location;

  if (import.meta.env.DEV && port === "5173") {
    return "/api";
  }

  if (import.meta.env.DEV && isLoopbackHost(hostname)) {
    return apiUrlForBrowserHost(hostname);
  }

  return origin;
};

export const API_BASE_URL = resolveApiBaseUrl();

const hasStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

export const getStoredAuthToken = () =>
  hasStorage() ? window.localStorage.getItem(AUTH_TOKEN_KEY) || "" : "";

export const storeAuthToken = (token) => {
  if (hasStorage()) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
};

export const clearStoredAuthToken = () => {
  if (hasStorage()) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.response = {
        data: {
          detail: `Could not reach the backend API at ${API_BASE_URL || "the current site"}. Make sure the backend server is running and reachable.`
        }
      };
    }
    return Promise.reject(error);
  }
);

export const scanUrl = async (payload) => {
  const { data } = await api.post("/predict/url", payload);
  return data;
};

export const scanEmail = async (payload) => {
  const { data } = await api.post("/predict/email", payload);
  return data;
};

export const scanSms = async (payload) => {
  const { data } = await api.post("/predict/sms", payload);
  return data;
};

export const scanSocial = async (payload) => {
  const { data } = await api.post("/predict/social", payload);
  return data;
};

export const getLogs = async (limit = 100) => {
  const { data } = await api.get(`/logs?limit=${limit}`);
  return data;
};

export const getStats = async () => {
  const { data } = await api.get("/stats");
  return data;
};

export const getHealth = async () => {
  const { data } = await api.get("/health");
  return data;
};

export const registerAccount = async (payload) => {
  const { data } = await api.post("/auth/register", payload);
  return data;
};

export const loginAccount = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  return data;
};

export const logoutAccount = async () => {
  const { data } = await api.post("/auth/logout");
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};

export const resendVerificationEmail = async () => {
  const { data } = await api.post("/auth/resend-verification");
  return data;
};

export const verifyEmailToken = async (token) => {
  const { data } = await api.get(`/auth/verify?token=${encodeURIComponent(token)}`);
  return data;
};

export const sendSnapshotEmail = async (scanId) => {
  const { data } = await api.post(`/snapshots/${scanId}/email`);
  return data;
};

export default api;
