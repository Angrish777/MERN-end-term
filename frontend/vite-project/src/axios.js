import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8084";

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
