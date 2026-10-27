import { createContext, useContext, useEffect, useState } from "react";
import api from "../axios";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/api/auth/me")
            .then((res) => setUser(res.data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const authenticate = async (path, body) => {
        const res = await api.post(`/api/auth/${path}`, body);
        setUser(res.data.user);
    };

    const logout = async () => {
        await api.post("/api/auth/logout");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, authenticate, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
