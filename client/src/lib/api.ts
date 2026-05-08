import axios from 'axios';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, {
          withCredentials: true,
        });
        accessToken = data.data.accessToken;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        accessToken = null;
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
