import axios from "axios";
import { getAccessToken } from "./session";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.code;

    if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
      return Promise.reject({
        status,
        message:
          "The server is taking too long to respond. Please try again later.",
        action: "Retry the request.",
      });
    }

    if (!error.response) {
      return Promise.reject({
        status,
        message:
          "We couldn't connect to the server. Please check your connection and try again.",
        action: "Retry the request.",
      });
    }

    if (status >= 500) {
      return Promise.reject({
        status,
        message: "The server is having a problem. Please try again later.",
        action: "Retry the request later.",
      });
    }

    return Promise.reject({
      status,
      code: error.response.data?.error,
      details: error.response.data?.details ?? [],
      message:
        error.response.data?.message ||
        "Something went wrong. Please try again.",
      action: "Retry the request.",
    });
  },
);

export default client;
