import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Auth from "./pages/Auth";
import Audit from "./pages/Audit";
import Pitch from "./pages/Pitch";

function Protected({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="center">Loading...</div>;
    return user ? children : <Navigate to="/login" replace />;
}

function Navbar() {
    const { user, logout } = useAuth();
    if (!user) return null;
    return (
        <header className="nav">
            <strong className="brand">DevElevate</strong>
            <nav>
                <NavLink to="/" end>Auditor</NavLink>
                <NavLink to="/pitch">Pitch</NavLink>
            </nav>
            <div className="who">
                <span>{user.name}</span>
                <button className="btn" onClick={logout}>Log out</button>
            </div>
        </header>
    );
}

export default function App() {
    const { user, loading } = useAuth();
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/login" element={loading ? <div className="center">Loading...</div> : user ? <Navigate to="/" replace /> : <Auth />} />
                <Route path="/" element={<Protected><Audit /></Protected>} />
                <Route path="/pitch" element={<Protected><Pitch /></Protected>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
