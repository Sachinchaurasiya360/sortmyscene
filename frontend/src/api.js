import axios from 'axios';

const TOKEN_KEY = 'sms_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// In dev, `/api` is proxied to the local backend by Vite (see vite.config.js).
// In production builds, VITE_API_BASE_URL points at the deployed backend.
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({ baseURL });

// Attach the bearer token to every request when present.
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise the server's { error } payload into a thrown Error message.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.message ||
      'Something went wrong. Please try again.';
    const wrapped = new Error(message);
    wrapped.status = err.response?.status;
    return Promise.reject(wrapped);
  }
);

export default api;
