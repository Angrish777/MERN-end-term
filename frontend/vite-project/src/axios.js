import axios from "axios";

// In production on Vercel, if VITE_API_URL is not set, default to "" (relative URL)
// so requests hit the same origin (/api/...) handled by Vercel rewrites.
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:8084");

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

export const errorMessage = (error) =>
    error.response?.data?.message || "Could not reach the server. Try again.";

export default api;
