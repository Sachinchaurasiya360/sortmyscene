import axios from 'axios';

const TOKEN_KEY = 'sms_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({ baseURL: '/api' });

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
