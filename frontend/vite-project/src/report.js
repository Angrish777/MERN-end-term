export const toMarkdown = (scan) => {
    const when = new Date(scan.createdAt || Date.now()).toLocaleString();
    let out = `# DevElevate Audit Report\n\n- Date: ${when}\n- Type: ${scan.kind}\n- Quality score: ${scan.score}/100\n- Complexity: ${scan.complexity}\n- Security risk: ${scan.risk}\n- Findings: ${scan.issues.length}\n\n## Findings\n\n`;
    if (!scan.issues.length) return `${out}No issues found.\n`;
    for (const cat of ["Security", "Style", "Performance"]) {
        const list = scan.issues.filter((i) => i.cat === cat);
        if (!list.length) continue;
        out += `### ${cat}\n\n`;
        for (const i of list) {
            out += `- [${i.sev.toUpperCase()}] Line ${i.line}: ${i.msg}\n  - Fix: ${i.fix}\n`;
        }
        out += "\n";
    }
    return out;
};

export const download = (name, text, type = "text/markdown") => {
    const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
};

export const copyText = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        let ok = false;
        try {
            ok = document.execCommand("copy");
        } catch (e) {
            ok = false;
        }
        area.remove();
        return ok;
    }
};
