import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../axios";
import { useNote } from "../useNote";
import { copyText, download } from "../report";

const blank = { title: "", tagline: "", features: "", stack: "", audience: "", tone: "pro" };

export default function Pitch() {
    const [form, setForm] = useState(blank);
    const [busy, setBusy] = useState(false);
    const [current, setCurrent] = useState(null);
    const [view, setView] = useState("readme");
    const [saved, setSaved] = useState([]);
    const [toast, notify] = useNote();

    const load = useCallback(async () => {
        try {
            const res = await api.get("/api/pitches");
            setSaved(res.data.pitches);
        } catch (error) {
            notify(errorMessage(error), true);
        }
    }, [notify]);

    useEffect(() => {
        load();
    }, [load]);

    const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        const features = form.features.split("\n").map((f) => f.replace(/^[-*\d.)\s]+/, "").trim()).filter(Boolean);
        if (form.title.trim().length < 2) return notify("Enter a project title", true);
        if (new Set(features).size < 2) return notify("List at least 2 features, one per line", true);
        setBusy(true);
        try {
            const res = await api.post("/api/pitches", {
                ...form,
                features,
                stack: form.stack.split(",").map((s) => s.trim()).filter(Boolean)
            });
            setCurrent(res.data.pitch);
            setView("readme");
            await load();
            notify("README and pitch generated");
        } catch (error) {
            notify(errorMessage(error), true);
        }
        setBusy(false);
    };

    const remove = async (id) => {
        if (!window.confirm("Delete this pitch?")) return;
        try {
            await api.delete(`/api/pitches/${id}`);
            if (current?._id === id) setCurrent(null);
            await load();
            notify("Pitch deleted");
        } catch (error) {
            notify(errorMessage(error), true);
        }
    };

    const text = current ? (view === "readme" ? current.readme : current.pitch) : "";

    return (
        <main className="page">
            <section className="split">
                <form className="card" onSubmit={submit} noValidate>
                    <h2>Describe your project</h2>
                    <input className="inp" name="title" placeholder="Project title" maxLength={80} value={form.title} onChange={change} />
                    <input className="inp" name="tagline" placeholder="One-line summary" maxLength={140} value={form.tagline} onChange={change} />
                    <textarea className="inp" name="features" rows={5} placeholder={"Core features, one per line\nDrag-and-drop boards\nOffline sync"} value={form.features} onChange={change} />
                    <input className="inp" name="stack" placeholder="Tech stack, comma separated" value={form.stack} onChange={change} />
                    <div className="row">
                        <input className="inp" name="audience" placeholder="Audience" maxLength={60} value={form.audience} onChange={change} />
                        <select className="inp" name="tone" value={form.tone} onChange={change}>
                            <option value="pro">Professional</option>
                            <option value="bold">Energetic</option>
                            <option value="min">Minimal</option>
                        </select>
                    </div>
                    <button className="btn pri" disabled={busy}>{busy ? "Generating..." : "Generate README and pitch"}</button>
                </form>

                <div className="card">
                    {!current ? (
                        <div className="empty">
                            <h2>Nothing generated yet</h2>
                            <p className="muted">Add a title and at least two features to get a README.md and a 60-second pitch.</p>
                        </div>
                    ) : (
                        <>
                            <div className="row between">
                                <div className="row">
                                    <button className={view === "readme" ? "chip on" : "chip"} onClick={() => setView("readme")}>README.md</button>
                                    <button className={view === "pitch" ? "chip on" : "chip"} onClick={() => setView("pitch")}>60-sec pitch</button>
                                </div>
                                <div className="row">
                                    <button className="btn" onClick={async () => notify((await copyText(text)) ? "Copied" : "Copy failed")}>Copy</button>
                                    <button className="btn" onClick={() => view === "readme" ? download("README.md", current.readme) : download("elevator-pitch.txt", current.pitch, "text/plain")}>Download</button>
                                </div>
                            </div>
                            <p className="muted small">{view === "pitch" ? `${current.words} words, about ${Math.round(current.words / 2.5)} seconds` : "Markdown"}</p>
                            <pre className="out mono">{text}</pre>
                        </>
                    )}
                </div>
            </section>

            <section className="card">
                <h2>Saved pitches</h2>
                {saved.length === 0 ? (
                    <p className="muted">Generated pitches are saved to your account and appear here.</p>
                ) : (
                    <ul className="hist">
                        {saved.map((p) => (
                            <li key={p._id}>
                                <div><b>{p.title}</b><small className="muted">{new Date(p.createdAt).toLocaleString()} · {p.features.length} features</small></div>
                                <button className="btn" onClick={() => { setCurrent(p); setView("readme"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Open</button>
                                <button className="btn" onClick={() => remove(p._id)}>Delete</button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
            {toast}
        </main>
    );
}
