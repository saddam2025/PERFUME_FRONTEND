import axios from "axios";

const TOKEN_STORAGE_KEY = "toronto_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Only clear the token if the server says the token itself is bad/expired.
// Do NOT clear on every 401 — some routes are protected and return 401
// for missing permissions, not invalid tokens.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const msg = error.response.data?.message || "";
      const tokenIsInvalid =
        msg.includes("expired") ||
        msg.includes("Invalid token") ||
        msg.includes("no longer exists") ||
        msg.includes("No token provided");
      if (tokenIsInvalid) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
    return Promise.reject(error);
  }
);

export { TOKEN_STORAGE_KEY };
export default api;