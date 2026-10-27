import { useState } from "react";
import { errorMessage } from "../axios";
import { useAuth } from "../context/AuthContext";
import { useNote } from "../useNote";

export default function Auth() {
    const { authenticate } = useAuth();
    const [signup, setSignup] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [busy, setBusy] = useState(false);
    const [toast, notify] = useNote();

    const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        if (signup && !form.name.trim()) return notify("Enter your name", true);
        if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return notify("Enter a valid email", true);
        if (form.password.length < 6) return notify("Password needs at least 6 characters", true);
        setBusy(true);
        try {
            await authenticate(signup ? "register" : "login", signup ? form : { email: form.email, password: form.password });
        } catch (error) {
            notify(errorMessage(error), true);
            setBusy(false);
        }
    };

    return (
        <main className="auth">
            <form className="card" onSubmit={submit} noValidate>
                <h1>{signup ? "Create your account" : "Welcome back"}</h1>
                <p className="muted">Audit code and résumés, then turn projects into a README and a 60-second pitch.</p>
                {signup && <input className="inp" name="name" placeholder="Name" value={form.name} onChange={change} autoComplete="name" />}
                <input className="inp" name="email" type="email" placeholder="Email" value={form.email} onChange={change} autoComplete="email" />
                <input className="inp" name="password" type="password" placeholder="Password" value={form.password} onChange={change} autoComplete={signup ? "new-password" : "current-password"} />
                <button className="btn pri" disabled={busy}>{busy ? "Please wait..." : signup ? "Sign up" : "Log in"}</button>
                <button type="button" className="link" onClick={() => setSignup(!signup)}>
                    {signup ? "Already have an account? Log in" : "New here? Create an account"}
                </button>
            </form>
            {toast}
        </main>
    );
}
