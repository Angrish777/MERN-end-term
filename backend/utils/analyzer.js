import vm from "vm";

const PENALTY = { critical: 18, high: 10, medium: 5, low: 2 };
const ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const RULES = [
    ["Security", "critical", /(?:api[_-]?key|secret|passw(?:or)?d|token)\s*[:=]\s*["'`][^"'`\s]{6,}/gi, "Hard-coded credential found in source.", "Move secrets to environment variables and rotate the exposed value."],
    ["Security", "critical", /\beval\s*\(/g, "eval() runs arbitrary strings as code.", "Replace it with JSON.parse, a lookup table or a function reference."],
    ["Security", "high", /new\s+Function\s*\(/g, "new Function() compiles strings into code at runtime.", "Use plain functions or a safe expression parser."],
    ["Security", "high", /\.(?:innerHTML|outerHTML)\s*\+?=/g, "Assigning HTML strings can enable XSS.", "Use textContent, or sanitize with DOMPurify first."],
    ["Security", "high", /\bset(?:Timeout|Interval)\s*\(\s*["'`]/g, "Timer receives a string, which behaves like eval().", "Pass a function: setTimeout(() => refresh(), 1000)."],
    ["Security", "medium", /document\.write(?:ln)?\s*\(/g, "document.write can inject unsanitized content.", "Build nodes with createElement and append them."],
    ["Security", "medium", /Math\.random\(\)[^\n;]*/g, "Math.random() is not cryptographically secure.", "Use crypto.getRandomValues() for tokens and ids."],
    ["Security", "medium", /["'`]http:\/\/(?!localhost|127\.0\.0\.1)[^"'`\s]+/g, "Insecure http:// URL.", "Use https:// to prevent eavesdropping."],
    ["Security", "medium", /target=["']_blank["'](?![^>]{0,1000}noopener)/gi, "target=\"_blank\" without rel=\"noopener\".", "Add rel=\"noopener noreferrer\" to the link."],
    ["Performance", "high", /\.open\([^)]*,\s*false\s*\)/g, "Synchronous XMLHttpRequest blocks the main thread.", "Use fetch() with async/await."],
    ["Performance", "high", /(?:for|while)\s*\([^)]*\)\s*\{[\s\S]{0,250}?(?:getElementById|querySelector(?:All)?|getElementsBy\w+)\(/g, "DOM lookup inside a loop.", "Query once before the loop and reuse the reference."],
    ["Performance", "medium", /for\s*\([^)]*\)\s*\{[^{}]*for\s*\(/g, "Nested loops suggest O(n^2) work.", "Use a Map or Set for lookups, or restructure into a single pass."],
    ["Performance", "medium", /innerHTML\s*\+=/g, "innerHTML += re-parses the whole subtree each time.", "Collect HTML in an array and assign once."],
    ["Performance", "medium", /JSON\.parse\(\s*JSON\.stringify\(/g, "JSON deep clone is slow and lossy.", "Use structuredClone(value)."],
    ["Performance", "low", /<script\s+src=(?![^>]{0,1000}(?:defer|async))[^>]{0,1000}>/gi, "Blocking script tag.", "Add defer or async."],
    ["Style", "medium", /[^=!<>]==(?!=)|!=(?!=)/g, "Loose equality causes type coercion bugs.", "Use === and !==."],
    ["Style", "medium", /catch\s*\([^)]*\)\s*\{\s*\}/g, "Empty catch block swallows errors.", "Log or handle the error, or rethrow it."],
    ["Style", "medium", /\bdebugger\b/g, "debugger statement left in code.", "Remove it before shipping."],
    ["Style", "medium", /<img(?![^>]{0,1000}\balt=)[^>]{0,1000}>/gi, "Image without alt text.", "Add a meaningful alt attribute."],
    ["Style", "low", /\bvar\s+\w/g, "var has function scope and hoisting quirks.", "Use const, or let when reassigning."],
    ["Style", "low", /\bconsole\.(?:log|debug)\(/g, "console statement left in code.", "Remove it or use a logger."],
    ["Style", "low", /\b(?:TODO|FIXME|HACK)\b/g, "Unfinished work marker.", "Resolve it or track it in an issue."],
    ["Style", "low", /!important/g, "!important makes CSS hard to override.", "Raise selector specificity instead."],
    ["Style", "low", /^.{121,}$/gm, "Line longer than 120 characters.", "Break it into several lines."]
];

const lineOf = (text, index) => {
    let line = 1;
    for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
    return line;
};

const strip = (text) =>
    text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$|(["'`])(?:\\.|(?!\1)[^\\])*\1/gm, (m) => m.replace(/[^\n]/g, ""));

const issue = (cat, sev, line, msg, fix, snip = "") => ({ cat, sev, line, msg, fix, snip });

const bracketCheck = (text) => {
    const stack = [];
    const pairs = { ")": "(", "]": "[", "}": "{" };
    let line = 1;
    for (const ch of text) {
        if (ch === "\n") line++;
        else if ("([{".includes(ch)) stack.push([ch, line]);
        else if (")]}".includes(ch)) {
            const top = stack.pop();
            if (!top || top[0] !== pairs[ch]) return { line, msg: `Unmatched "${ch}"` };
        }
    }
    if (stack.length) {
        const last = stack[stack.length - 1];
        return { line: last[1], msg: `Unclosed "${last[0]}"` };
    }
    return null;
};

const detectKind = (code, mode) => {
    if (mode === "code" || mode === "resume") return mode;
    const md = (code.match(/^\s*(?:#{1,4}\s|[-*]\s)/gm) || []).length;
    const cs = (code.match(/[{};]|=>|\b(?:function|const|let|var|return)\b|<\/?\w+/g) || []).length;
    return md > 0 && md * 2 >= cs ? "resume" : "code";
};

const analyzeCode = (code) => {
    const issues = [];

    for (const [cat, sev, re, msg, fix] of RULES) {
        re.lastIndex = 0;
        let m;
        let count = 0;
        while ((m = re.exec(code)) && count < 5) {
            issues.push(issue(cat, sev, lineOf(code, m.index), msg, fix, m[0].trim().split("\n")[0].slice(0, 70)));
            count++;
            if (m[0] === "") re.lastIndex++;
        }
    }

    const isHtml = /<\w+[^>]{0,1000}>/.test(code) && /<\/\w+>/.test(code) && !/^\s*(?:const|let|var|function|import)\b/.test(code);
    const js = isHtml
        ? [...code.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join("\n")
        : code;
    const cssLike =
        !isHtml && /[\w.#:-]{1,100}\s*\{\s*[\w-]+\s*:/.test(code) && !/\b(?:function|const|let|var|return)\b|=>/.test(code);

    let broken = false;
    if (js.trim() && !cssLike && !/^\s*(?:import|export)\s/m.test(js)) {
        try {
            new vm.Script(js);
        } catch (error) {
            broken = true;
            issues.push(issue("Style", "critical", 1, `Syntax error: ${error.message}`, "Fix the syntax error first. The script could not be parsed."));
        }
    }

    const cleaned = strip(js);

    if (!broken && cleaned.trim()) {
        const mismatch = bracketCheck(cleaned);
        if (mismatch) issues.push(issue("Style", "critical", mismatch.line, `Bracket mismatch: ${mismatch.msg}.`, "Make sure every opening bracket has a closing one."));
    }

    const cc = 1 + (cleaned.match(/\b(?:if|for|while|case|catch)\b|&&|\|\||\?(?![.?])/g) || []).length;
    let depth = 0;
    let level = 0;
    for (const ch of cleaned) {
        if (ch === "{") {
            level++;
            depth = Math.max(depth, level);
        } else if (ch === "}") level = Math.max(0, level - 1);
    }

    if (depth >= 5) issues.push(issue("Style", "medium", 1, `Deep nesting (${depth} levels).`, "Use early returns and extract helper functions."));
    if (cc > 20) issues.push(issue("Style", "medium", 1, `High cyclomatic complexity (${cc}).`, "Split the logic into smaller functions."));

    const complexity = cc <= 10 ? "Low" : cc <= 20 ? "Moderate" : cc <= 40 ? "High" : "Very high";
    return { issues, cc, depth, complexity };
};

const analyzeResume = (text) => {
    const issues = [];
    const lines = text.split("\n");
    const words = (text.match(/\b\w+\b/g) || []).length;

    const scan = (re, cat, sev, msg, fix) => {
        lines.forEach((line, i) => {
            if (re.test(line)) issues.push(issue(cat, sev, i + 1, msg, fix, line.trim().slice(0, 70)));
        });
    };

    scan(/responsible for|duties included/i, "Style", "medium", "Passive phrasing hides your impact.", "Start with a strong verb such as Built, Reduced or Led.");
    scan(/\b(?:helped|worked on|assisted|involved in)\b/i, "Style", "medium", "Vague contribution wording.", "State exactly what you did and the outcome.");
    scan(/\bI\s/, "Style", "low", "First-person pronoun.", "Drop the pronoun and open with an action verb.");
    scan(/really|very good|hard[- ]working|team player|passionate/i, "Style", "low", "Filler or cliche wording.", "Replace it with evidence such as a metric or a shipped result.");
    scan(/^.{161,}$/, "Performance", "low", "Bullet is too long to skim.", "Keep bullets under roughly 25 words.");
    scan(/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b|home address|street address/i, "Security", "low", "Personal contact data exposed.", "Share only an email and a profile link on public documents.");
    scan(/(?:passw(?:or)?d|secret|api[_-]?key|token)\s*[:=]\s*\S{6,}/i, "Security", "critical", "Credential found in the text.", "Remove it and rotate the secret.");

    if (words < 60) issues.push(issue("Style", "medium", 1, `Too short (${words} words).`, "Add projects, skills, education and two or three impact bullets per project."));
    if (words > 900) issues.push(issue("Performance", "low", 1, `Very long (${words} words).`, "Aim for one or two pages."));
    if (!/\d+\s*(?:%|x\b|\+|k\b|ms\b|users|students|hrs|hours)|\$\s?\d/i.test(text)) issues.push(issue("Style", "high", 1, "No measurable results found.", "Add numbers, for example: cut load time by 40%."));
    if (!/[\w.+-]+@[\w-]+\.\w+/.test(text)) issues.push(issue("Style", "medium", 1, "No email address found.", "Add a professional contact email."));
    if (!/github\.com|linkedin\.com|portfolio|https?:\/\//i.test(text)) issues.push(issue("Style", "low", 1, "No GitHub, LinkedIn or portfolio link.", "Link to your best work."));

    const missing = [["Projects or Experience", /project|experience/i], ["Skills", /skill/i], ["Education", /education|degree|b\.?tech|university/i]]
        .filter(([, re]) => !re.test(text))
        .map(([name]) => name);
    if (missing.length) issues.push(issue("Style", "low", 1, `Missing sections: ${missing.join(", ")}.`, "Add the missing headings so scanners find them."));

    const avg = words / Math.max(1, lines.filter((l) => l.trim()).length);
    return { issues, cc: 0, depth: 0, complexity: avg < 14 ? "Low" : avg < 24 ? "Moderate" : "High" };
};

export const analyze = (input, mode = "auto") => {
    const kind = detectKind(input, mode);
    const started = performance.now();
    const result = kind === "resume" ? analyzeResume(input) : analyzeCode(input);
    const ms = +(performance.now() - started).toFixed(2);

    const issues = result.issues.sort((a, b) => ORDER[a.sev] - ORDER[b.sev] || a.line - b.line);
    const score = Math.max(0, 100 - issues.reduce((sum, i) => sum + PENALTY[i.sev], 0));
    const worst = issues.filter((i) => i.cat === "Security").map((i) => i.sev).sort((a, b) => ORDER[a] - ORDER[b])[0];

    return {
        kind,
        score,
        complexity: result.complexity,
        risk: worst ? worst[0].toUpperCase() + worst.slice(1) : "Minimal",
        issues,
        metrics: { lines: input.split("\n").length, chars: input.length, cc: result.cc, depth: result.depth, ms },
        title: (input.trim().split("\n")[0] || "Untitled").slice(0, 48)
    };
};
