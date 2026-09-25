import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:4000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
client.interceptors.request.use((config) => {
  console.log(`${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    return Promise.reject({
      status,
      message:
        status === 404
          ? "The requested resource could not be found."
          : "Something went wrong. Please try again.",
      originalError: error,
    });
  },
);

export default client;
