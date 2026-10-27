const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const trimEnd = (s) => s.replace(/[.!]+$/, "");

export const buildPitch = (d) => {
    const top = d.features.slice(0, 3).map((f) => trimEnd(f).toLowerCase());
    const list = top.length > 2 ? `${top[0]}, ${top[1]} and ${top[2]}` : top.join(" and ");
    const audience = d.audience || "people like us";
    const hooks = {
        pro: `Every day, ${audience} lose time to tools that were never built for them.`,
        bold: `Picture this: ${audience}, finally getting the tool they deserve.`,
        min: `${cap(audience)} need something simpler.`
    };
    const extra = d.features.length - 3;

    const parts = [
        hooks[d.tone],
        `That is why I built ${d.title}${d.tagline ? `, ${d.tagline.charAt(0).toLowerCase()}${trimEnd(d.tagline).slice(1)}` : ""}.`,
        `With ${d.title} you get ${list}. Each feature solves a real everyday problem without a learning curve.`,
        d.stack.length
            ? `It is built on ${d.stack.slice(0, 4).join(", ")}, so it is quick to ship and easy to extend.`
            : "It is lightweight, quick to ship and easy to extend.",
        extra > 0 ? `And there is more: ${extra} additional feature${extra > 1 ? "s" : ""}, including ${trimEnd(d.features[3]).toLowerCase()}.` : "",
        "Early feedback points to one result: people save time and stay focused. Next, I am growing the user base and collecting real usage data.",
        d.tone === "bold" ? `${d.title}: built to move you forward. Let us build it together.` : `${d.title}: simple, useful and ready today. Thank you.`
    ].filter(Boolean);

    const text = parts.join("\n\n");
    return { text, words: (text.match(/\S+/g) || []).length };
};

export const buildReadme = (d) => {
    const slug = d.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
    const stack = d.stack.length ? `## Tech Stack\n\n${d.stack.map((s) => `- ${s}`).join("\n")}\n\n` : "";
    return `# ${d.title}

${d.tagline ? `> ${d.tagline}\n\n` : ""}![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

## About

${d.title} is built for ${d.audience || "everyday users"}. It focuses on ${d.features.slice(0, 2).join(" and ").toLowerCase()}.

## Features

${d.features.map((f) => `- ${f}`).join("\n")}

${stack}## Getting Started

\`\`\`bash
git clone https://github.com/<your-username>/${slug}.git
cd ${slug}
npm install
npm start
\`\`\`

## Roadmap

- [x] Core features
- [ ] Automated tests
- [ ] Accessibility audit
- [ ] Public release

## Contributing

Fork the repository, create a feature branch and open a pull request with a clear description.

## License

Distributed under the MIT License.
`;
};
