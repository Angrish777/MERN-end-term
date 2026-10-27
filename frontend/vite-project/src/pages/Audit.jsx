import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../axios";
import { SAMPLES } from "../samples";
import { useNote } from "../useNote";
import { copyText, download, toMarkdown } from "../report";

const CATS = ["All", "Security", "Style", "Performance"];
const MAX = 50000;

export default function Audit() {
    const [code, setCode] = useState("");
    const [mode, setMode] = useState("auto");
    const [busy, setBusy] = useState(false);
    const [scan, setScan] = useState(null);
    const [filter, setFilter] = useState("All");
    const [query, setQuery] = useState("");
    const [history, setHistory] = useState([]);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [stats, setStats] = useState(null);
    const [toast, notify] = useNote();

    const loadHistory = useCallback(async () => {
        try {
            const res = await api.get("/api/scans", { params: { search, sort, page, limit: 5 } });
            setHistory(res.data.scans);
            setPages(res.data.pages);
        } catch (error) {
            notify(errorMessage(error), true);
        }
    }, [search, sort, page, notify]);

    const loadStats = useCallback(async () => {
        try {
            const res = await api.get("/api/scans/stats");
            setStats(res.data.stats);
        } catch (error) {
            notify(errorMessage(error), true);
        }
    }, [notify]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const run = async () => {
        if (!code.trim()) return notify("Input is empty. Paste code or choose a preset.", true);
        if (code.trim().length < 10) return notify("Input is too short to analyze", true);
        if (code.length > MAX) return notify("Input exceeds 50,000 characters", true);
        setBusy(true);
        try {
            const res = await api.post("/api/scans", { input: code, mode });
            setScan(res.data.scan);
            setFilter("All");
            setQuery("");
            setPage(1);
            await Promise.all([loadHistory(), loadStats()]);
            notify(`Audit complete: ${res.data.scan.score}/100`);
        } catch (error) {
            notify(errorMessage(error), true);
        }
        setBusy(false);
    };

    const open = async (id) => {
        try {
            const res = await api.get(`/api/scans/${id}`);
            setScan(res.data.scan);
            setCode(res.data.scan.input);
            setMode(res.data.scan.kind);
            setFilter("All");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
            notify(errorMessage(error), true);
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Delete this scan?")) return;
        try {
            await api.delete(`/api/scans/${id}`);
            if (scan?._id === id) setScan(null);
            await Promise.all([loadHistory(), loadStats()]);
            notify("Scan deleted");
        } catch (error) {
            notify(errorMessage(error), true);
        }
    };

    const copy = async () => notify((await copyText(toMarkdown(scan))) ? "Report copied" : "Copy failed", false);

    const shown = scan
        ? scan.issues.filter(
              (i) =>
                  (filter === "All" || i.cat === filter) &&
                  (!query.trim() || `${i.msg} ${i.fix} ${i.snip}`.toLowerCase().includes(query.trim().toLowerCase()))
          )
        : [];

    const tone = (s) => (s >= 80 ? "good" : s >= 55 ? "warn" : "bad");

    return (
        <main className="page">
            {stats && (
                <section className="stats">
                    <div className="card"><span>Scans</span><b>{stats.total}</b></div>
                    <div className="card"><span>Average score</span><b>{stats.average}</b></div>
                    <div className="card"><span>Best score</span><b>{stats.best}</b></div>
                    <div className="card"><span>Findings</span><b>{stats.findings}</b></div>
                    <div className="card trend" title="Last 10 scores">
                        {stats.recent.map((r) => (
                            <i key={r._id} className={tone(r.score)} style={{ height: `${Math.max(6, r.score)}%` }} />
                        ))}
                    </div>
                </section>
            )}

            <section className="split">
                <div className="card">
                    <h2>Paste code or a résumé</h2>
                    <div className="row">
                        {["security", "performance", "refactor", "resume"].map((k) => (
                            <button key={k} className="chip" onClick={() => { setCode(SAMPLES[k]); setMode(k === "resume" ? "resume" : "code"); }}>
                                {k === "security" ? "Security Audit" : k === "performance" ? "Performance Check" : k === "refactor" ? "Refactor Request" : "Résumé Sample"}
                            </button>
                        ))}
                    </div>
                    <textarea className="inp mono" rows={16} value={code} onChange={(e) => setCode(e.target.value)} spellCheck="false" placeholder="Paste a JavaScript, HTML or CSS snippet, or a Markdown résumé" />
                    <div className="row between muted"><small>{code.length.toLocaleString()} / 50,000</small></div>
                    <div className="row">
                        <select className="inp auto" value={mode} onChange={(e) => setMode(e.target.value)}>
                            <option value="auto">Auto-detect</option>
                            <option value="code">Code</option>
                            <option value="resume">Résumé</option>
                        </select>
                        <button className="btn pri" onClick={run} disabled={busy}>{busy ? "Analyzing..." : "Run audit"}</button>
                        <button className="btn" onClick={() => setCode("")}>Clear</button>
                    </div>
                </div>

                <div id="report" className="card">
                    {!scan ? (
                        <div className="empty">
                            <h2>No audit yet</h2>
                            <p className="muted">Run an audit to see your quality score, risk level and suggested fixes.</p>
                        </div>
                    ) : (
                        <>
                            <div className="kpis">
                                <div><span>Quality</span><b className={tone(scan.score)}>{scan.score}</b></div>
                                <div><span>Complexity</span><b>{scan.complexity}</b></div>
                                <div><span>Security risk</span><b>{scan.risk}</b></div>
                                <div><span>Fixes</span><b>{scan.issues.length}</b></div>
                            </div>
                            <p className="muted mono small">{scan.metrics.lines} lines · engine {scan.metrics.ms} ms · {scan.kind} mode</p>
                            <div className="row between">
                                <div className="row">
                                    {CATS.map((c) => (
                                        <button key={c} className={filter === c ? "chip on" : "chip"} onClick={() => setFilter(c)}>
                                            {c} ({c === "All" ? scan.issues.length : scan.issues.filter((i) => i.cat === c).length})
                                        </button>
                                    ))}
                                </div>
                                <input className="inp auto" placeholder="Search findings" value={query} onChange={(e) => setQuery(e.target.value)} />
                            </div>
                            <ul className="issues">
                                {shown.length === 0 && <li className="muted">{scan.issues.length ? "No findings match this filter." : "No issues found. Clean result."}</li>}
                                {shown.map((i, n) => (
                                    <li key={n}>
                                        <div className="row"><span className={`sev ${i.sev}`}>{i.sev}</span><small className="muted">{i.cat} · line {i.line}</small></div>
                                        <p>{i.msg}</p>
                                        {i.snip && <code>{i.snip}</code>}
                                        <p className="fix">Fix: {i.fix}</p>
                                    </li>
                                ))}
                            </ul>
                            <div className="row noprint">
                                <button className="btn" onClick={copy}>Copy report</button>
                                <button className="btn" onClick={() => download(`develevate-report-${scan._id}.md`, toMarkdown(scan))}>Download Markdown</button>
                                <button className="btn" onClick={() => window.print()}>Export PDF</button>
                            </div>
                        </>
                    )}
                </div>
            </section>

            <section className="card noprint">
                <div className="row between">
                    <h2>Scan history</h2>
                    <div className="row">
                        <input className="inp auto" placeholder="Search by title" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                        <select className="inp auto" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="score_high">Highest score</option>
                            <option value="score_low">Lowest score</option>
                        </select>
                    </div>
                </div>
                {history.length === 0 ? (
                    <p className="muted">No saved scans match. Run an audit and it appears here.</p>
                ) : (
                    <ul className="hist">
                        {history.map((h) => (
                            <li key={h._id}>
                                <b className={tone(h.score)}>{h.score}</b>
                                <div><span className="mono">{h.title}</span><small className="muted">{new Date(h.createdAt).toLocaleString()} · {h.kind} · {h.issues.length} {h.issues.length === 1 ? "finding" : "findings"}</small></div>
                                <button className="btn" onClick={() => open(h._id)}>Open</button>
                                <button className="btn" onClick={() => remove(h._id)}>Delete</button>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="row between">
                    <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                    <small className="muted">Page {page} of {pages}</small>
                    <button className="btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
                </div>
            </section>
            {toast}
        </main>
    );
}
