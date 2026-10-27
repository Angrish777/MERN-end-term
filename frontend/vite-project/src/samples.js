export const SAMPLES = {
    security: [
        'const API_KEY = "sk_live_51H8xKq92LmNoPq";',
        "function login(user) {",
        "  const token = Math.random().toString(36);",
        '  document.getElementById("out").innerHTML = "Welcome " + user;',
        "  eval(\"track('\" + user + \"')\");",
        '  setTimeout("refresh()", 1000);',
        '  fetch("http://example.com/api?key=" + API_KEY);',
        "}"
    ].join("\n"),
    performance: [
        'const rows = document.querySelectorAll(".row");',
        "for (let i = 0; i < data.length; i++) {",
        "  for (let j = 0; j < data.length; j++) {",
        '    document.getElementById("list").innerHTML += "<li>" + data[i] + "</li>";',
        "  }",
        "}",
        "const copy = JSON.parse(JSON.stringify(data));",
        "const xhr = new XMLHttpRequest();",
        'xhr.open("GET", "/data.json", false);',
        "xhr.send();"
    ].join("\n"),
    refactor: [
        "var total = 0;",
        "function calc(a, b, type) {",
        '  if (type == "add") {',
        "    if (a != null) {",
        "      if (b != null) {",
        "        for (var i = 0; i < 10; i++) {",
        "          if (i % 2 == 0) { total = total + a + b; }",
        "        }",
        "      }",
        "    }",
        "  }",
        "  console.log(total);",
        "  return total;",
        "}",
        'try { calc(1, 2, "add"); } catch (e) {}'
    ].join("\n"),
    resume: [
        "# Alex Rivera",
        "Full-stack developer",
        "",
        "## Projects",
        "- Responsible for building a web app for students",
        "- Helped with the backend and worked on some features",
        "- I made a chat tool that is really good and I think people like it",
        "",
        "## Skills",
        "JavaScript, React, Node.js"
    ].join("\n")
};
