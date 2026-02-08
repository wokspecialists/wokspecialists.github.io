const ORG = {
  name: "Wok Specialists",
  githubOrgUrl: "https://github.com/Wok-Specialists"
};

const ROUTES = {
  home: "/",
  chopsticks: "/chopsticks/",
  agents: "/chopsticks/agents/",
  packages: "/chopsticks/packages/",
  docs: "/chopsticks/docs/",
  status: "/chopsticks/status/",
  embed: "/chopsticks/embed/",
  contribute: "/contribute/"
};

const SITE = {
  nav: [
    { href: ROUTES.home, label: "Home" },
    { href: ROUTES.chopsticks, label: "Chopsticks" },
    { href: "/agents/", label: "Agents" },
    { href: "/packages/", label: "Packages" },
    { href: "/docs/", label: "Docs" },
    { href: "/status/", label: "Status" }
  ]
};

const OAUTH = {
  base: "https://discord.com/api/oauth2/authorize",
  scope: "bot applications.commands",
  defaultPermissions: "36700160"
};

const COMMANDS = [
  { name: "/help", desc: "Show available commands and quick tips." },
  { name: "/play <query|url>", desc: "Play audio in your current voice channel." },
  { name: "/queue", desc: "Show the queue." },
  { name: "/skip", desc: "Skip the current track." },
  { name: "/stop", desc: "Stop playback and clear the queue (behavior depends on rules)." },
  { name: "/pause", desc: "Pause playback." },
  { name: "/resume", desc: "Resume playback." },
  { name: "/nowplaying", desc: "Show current track." },
  { name: "/volume <0-100>", desc: "Set volume." },
  { name: "/shuffle", desc: "Shuffle the queue." }
];

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, "");
    else if (v !== false && v != null) node.setAttribute(k, String(v));
  }
  for (const c of children) node.append(c);
  return node;
}
function text(s) { return document.createTextNode(s); }

function normalizePath(p) {
  let out = (p || "/").replace(/index\.html$/, "");
  if (out !== "/" && !out.endsWith("/")) out += "/";
  return out;
}
function activePath() { return normalizePath(location.pathname || "/"); }

function iconSvg(name) {
  const common = `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  if (name === "github") return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M9 19c-4 1.5-4-2.5-6-3m12 6v-3.5c0-1 .1-1.4-.5-2 2.2-.2 4.5-1.1 4.5-5 0-1.1-.4-2.1-1.1-2.9.1-.3.5-1.5-.1-3.1 0 0-.9-.3-3 1.1a10.4 10.4 0 0 0-5.4 0C7.3 4.2 6.4 4.5 6.4 4.5c-.6 1.6-.2 2.8-.1 3.1A4 4 0 0 0 5.2 10c0 3.9 2.3 4.8 4.5 5-.3.3-.5.7-.5 1.5V22"/></svg>`;
  if (name === "spark") return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2z"/></svg>`;
  if (name === "tool") return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M14 7l3 3"/><path ${common} d="M10 14l-7 7"/><path ${common} d="M16 5a4 4 0 0 0-5 5L4 17l3 3 7-7a4 4 0 0 0 5-5l-3 3-3-3 3-3z"/></svg>`;
  return "";
}

function buildHeader() {
  const p = activePath();
  const header = el("header", { class: "site-header" });

  const brand = el("a", { class: "brand", href: ROUTES.home }, [
    el("span", { class: "brand-mark", "aria-hidden": "true" }, [text("▣")]),
    el("span", { class: "brand-name" }, [text(ORG.name)])
  ]);

  const nav = el("nav", { class: "nav", "aria-label": "Primary" });
  const ul = el("ul", { class: "nav-list" });

  for (const item of SITE.nav) {
    const itemPath = normalizePath(item.href);
    const isActive = itemPath === p;
    ul.append(el("li", {}, [
      el("a", { href: item.href, class: `nav-link ${isActive ? "is-active" : ""}` }, [text(item.label)])
    ]));
  }

  nav.append(ul);

  const right = el("div", { class: "header-right" }, [
    el("a", { class: "icon-btn", href: ORG.githubOrgUrl, target: "_blank", rel: "noopener noreferrer", title: "GitHub" }, [
      el("span", { class: "icon", html: iconSvg("github") })
    ])
  ]);

  header.append(brand, nav, right);
  return header;
}

function buildFooter() {
  return el("footer", { class: "site-footer" }, [
    el("div", { class: "footer-inner" }, [
      el("div", { class: "footer-left" }, [
        el("div", { class: "fine" }, [text(ORG.name)]),
        el("div", { class: "fine dim" }, [text("Projects across bots, games, art, and tools.")])
      ]),
      el("div", { class: "footer-right" }, [
        el("a", { class: "footer-link", href: ROUTES.chopsticks }, [text("Chopsticks")]),
        el("a", { class: "footer-link", href: ROUTES.embed }, [text("Embed builder")]),
        el("a", { class: "footer-link", href: ROUTES.contribute }, [text("Contribute")])
      ])
    ])
  ]);
}

function mountShell() {
  const mountHeader = qs("[data-mount='header']");
  const mountFooter = qs("[data-mount='footer']");
  if (mountHeader) mountHeader.replaceWith(buildHeader());
  if (mountFooter) mountFooter.replaceWith(buildFooter());
}

function toast(msg, kind = "info") {
  const host = qs("#toast-host") || el("div", { id: "toast-host" });
  if (!host.isConnected) document.body.append(host);
  const t = el("div", { class: `toast toast-${kind}` }, [el("div", { class: "toast-body" }, [text(msg)])]);
  host.append(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 200); }, 2200);
}

async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return await res.json();
}

function oauthInviteUrlFromAgent(agent) {
  if (agent.inviteUrl && typeof agent.inviteUrl === "string") return agent.inviteUrl;

  const raw = agent.clientId ? String(agent.clientId) : "";
  const clientId = raw && !raw.startsWith("CLIENT_ID_") ? raw : null;
  if (!clientId) return null;

  const permissions = agent.permissions ?? OAUTH.defaultPermissions;
  const u = new URL(OAUTH.base);
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("permissions", String(permissions));
  u.searchParams.set("scope", OAUTH.scope);
  return u.toString();
}

function renderAgentCard(agent) {
  const statusClass = agent.status === "available" ? "badge-ok" : "badge-soon";
  const statusLabel = agent.status === "available" ? "Available" : "Coming soon";
  const inviteUrl = oauthInviteUrlFromAgent(agent);
  const inviteConfigured = Boolean(inviteUrl);

  const inviteBtn = el("button", {
    class: `btn ${agent.status !== "available" ? "btn-disabled" : inviteConfigured ? "btn-green" : "btn-muted"}`,
    disabled: agent.status !== "available" || !inviteConfigured,
    onClick: () => inviteUrl && window.open(inviteUrl, "_blank", "noopener,noreferrer")
  }, [text(inviteConfigured ? "Invite" : "Invite not configured")]);

  const copyBtn = el("button", {
    class: `btn btn-ghost ${inviteConfigured ? "" : "btn-disabled"}`,
    disabled: !inviteConfigured,
    onClick: async () => {
      try { await navigator.clipboard.writeText(inviteUrl); toast("Copied.", "ok"); }
      catch { toast("Copy failed.", "warn"); }
    }
  }, [text("Copy")]);

  const tags = el("div", { class: "tag-row" }, (agent.tags || []).slice(0, 10).map(t => el("span", { class: "tag" }, [text(t)])));
  const caps = el("ul", { class: "caps" }, (agent.capabilities || []).slice(0, 8).map(c => el("li", {}, [text(c)])));

  return el("article", { class: "card" }, [
    el("div", { class: "card-title" }, [
      el("h3", { class: "h3" }, [text(agent.name || agent.agentId)]),
      el("span", { class: `badge ${statusClass}` }, [text(statusLabel)])
    ]),
    el("p", { class: "p dim" }, [text(agent.description || "")]),
    tags,
    el("div", { class: "hr" }),
    el("div", { class: "label" }, [text("Capabilities")]),
    caps,
    el("div", { class: "hr" }),
    el("div", { class: "row row-wrap" }, [inviteBtn, copyBtn])
  ]);
}

function renderAgentLists(agents) {
  const available = agents.filter(a => a.status === "available");
  const soon = agents.filter(a => a.status !== "available");

  const hostAvail = qs("[data-agents='available']");
  const hostSoon = qs("[data-agents='soon']");
  const soonWrap = qs("[data-section='soon']");
  const counts = qs("[data-agent-counts]");

  if (counts) {
    counts.textContent = `${available.length} available · ${soon.length} coming soon`;
  }
  if (hostAvail) {
    hostAvail.innerHTML = "";
    available.forEach(a => hostAvail.append(renderAgentCard(a)));
  }
  if (hostSoon) {
    hostSoon.innerHTML = "";
    soon.forEach(a => hostSoon.append(renderAgentCard(a)));
  }
  if (soonWrap) soonWrap.hidden = soon.length === 0;
}

function parseInviteUrls(textBlock) {
  return (textBlock || "")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => {
      const idx = l.lastIndexOf("http");
      return idx >= 0 ? l.slice(idx) : null;
    })
    .filter(Boolean);
}

function openInvitesStaggered(urls) {
  if (!urls.length) { toast("No invite links.", "warn"); return; }
  const delayMs = 700;
  let opened = 0;
  for (let i = 0; i < urls.length; i++) {
    setTimeout(() => {
      const w = window.open(urls[i], "_blank", "noopener,noreferrer");
      if (w) opened++;
      if (i === urls.length - 1) {
        if (opened === 0) toast("Popups blocked. Copy list instead.", "warn");
        else toast(`Opened ${opened}/${urls.length}.`, "ok");
      }
    }, i * delayMs);
  }
}

function renderInviteGenerator(agents) {
  const root = qs("[data-invite-generator]");
  if (!root) return;

  const available = agents.filter(a => a.status === "available");

  const countInput = el("input", { class: "input", type: "number", min: "1", step: "1", value: "2", "aria-label": "How many Agents" });
  const applyBtn = el("button", { class: "btn btn-blue" }, [text("Apply")]);

  const list = el("div", { class: "checklist" });
  available.forEach(a => {
    const id = `chk-${a.agentId}`;
    const input = el("input", { id, type: "checkbox", class: "check", value: a.agentId, onChange: refreshOutput });
    const label = el("label", { for: id, class: "checkline" }, [
      el("span", { class: "checkname" }, [text(a.name)]),
      el("span", { class: "checkmeta" }, [text(oauthInviteUrlFromAgent(a) ? "Ready" : "Missing")])
    ]);
    list.append(el("div", { class: "checkrow" }, [input, label]));
  });

  const out = el("textarea", { class: "textarea", rows: "9", readOnly: true, spellcheck: "false" });
  const warn = el("div", { class: "warnbox", hidden: true });

  const copyBtn = el("button", { class: "btn btn-green", onClick: async () => {
    try { await navigator.clipboard.writeText(out.value || ""); toast("Copied.", "ok"); }
    catch { toast("Copy failed.", "warn"); }
  }}, [text("Copy list")]);

  const openBtn = el("button", { class: "btn btn-red", onClick: () => openInvitesStaggered(parseInviteUrls(out.value)) }, [text("Open")]);

  applyBtn.addEventListener("click", () => {
    const n = Math.max(1, parseInt(countInput.value || "1", 10));
    const inputs = qsa("input[type='checkbox'].check", list);
    inputs.forEach((i, idx) => (i.checked = idx < n));
    refreshOutput();
  });

  root.innerHTML = "";
  root.append(
    el("div", { class: "panel" }, [
      el("div", { class: "panel-title" }, [text("Mass invite")]),
      el("p", { class: "p dim" }, [text("Enter how many Agents you want, apply, then open or copy the links.")]),
      el("div", { class: "row row-wrap mt" }, [countInput, applyBtn])
    ]),
    el("div", { class: "panel" }, [
      el("div", { class: "panel-title" }, [text("Select Agents")]),
      list
    ]),
    el("div", { class: "panel" }, [
      el("div", { class: "panel-title" }, [text("Invites")]),
      out,
      warn,
      el("div", { class: "row row-wrap mt" }, [copyBtn, openBtn])
    ])
  );

  function selectedAgentIds() {
    return qsa("input[type='checkbox'].check", list).filter(i => i.checked).map(i => i.value);
  }

  function refreshOutput() {
    const map = new Map(agents.map(a => [a.agentId, a]));
    const selected = selectedAgentIds().map(id => map.get(id)).filter(Boolean).filter(a => a.status === "available");

    const urls = selected.map(a => ({ a, url: oauthInviteUrlFromAgent(a) })).filter(x => Boolean(x.url));
    const missing = selected.map(a => ({ a, url: oauthInviteUrlFromAgent(a) })).filter(x => !x.url).map(x => x.a);

    out.value = urls.map(x => `${x.a.name} — ${x.url}`).join("\n");

    if (missing.length) {
      warn.hidden = false;
      warn.innerHTML = "";
      warn.append(
        el("div", { class: "warn-title" }, [text("Missing invites")]),
        el("ul", { class: "warn-list" }, missing.map(a => el("li", {}, [text(a.name)]))),
        el("div", { class: "hint" }, [text("Set clientId or inviteUrl in data/agents.json.")])
      );
    } else {
      warn.hidden = true;
    }
  }

  // default
  applyBtn.click();
}

function renderCommands() {
  const root = qs("[data-commands]");
  if (!root) return;

  const list = el("div", { class: "grid grid-cards" });
  COMMANDS.forEach(c => {
    list.append(el("div", { class: "card card-soft" }, [
      el("div", { class: "row row-wrap" }, [
        el("span", { class: "tag", html: `<span style="font-family:var(--mono)">${c.name}</span>` }),
        el("span", { class: "p dim" }, [text(c.desc)])
      ])
    ]));
  });

  root.innerHTML = "";
  root.append(list);
}

function renderEmbedBuilder() {
  const root = qs("[data-embed-builder]");
  if (!root) return;

  const title = el("input", { class: "input", placeholder: "Title" });
  const desc = el("textarea", { class: "textarea", rows: "5", placeholder: "Description" });
  const color = el("input", { class: "input", placeholder: "Color (hex)", value: "#2d7dff" });
  const author = el("input", { class: "input", placeholder: "Author (optional)" });
  const footer = el("input", { class: "input", placeholder: "Footer (optional)" });

  const out = el("textarea", { class: "textarea", rows: "10", readOnly: true, spellcheck: "false" });

  const copy = el("button", { class: "btn btn-green", onClick: async () => {
    try { await navigator.clipboard.writeText(out.value || ""); toast("Copied.", "ok"); }
    catch { toast("Copy failed.", "warn"); }
  }}, [text("Copy JSON")]);

  const build = el("button", { class: "btn btn-blue" }, [text("Build")]);

  function clampHex(h) {
    const x = (h || "").trim();
    if (!x) return null;
    const v = x.startsWith("#") ? x.slice(1) : x;
    if (!/^[0-9a-fA-F]{6}$/.test(v)) return null;
    return parseInt(v, 16);
  }

  function buildJson() {
    const embed = {};
    if (title.value.trim()) embed.title = title.value.trim();
    if (desc.value.trim()) embed.description = desc.value.trim();

    const c = clampHex(color.value);
    if (c != null) embed.color = c;

    if (author.value.trim()) embed.author = { name: author.value.trim() };
    if (footer.value.trim()) embed.footer = { text: footer.value.trim() };

    const payload = { embeds: [embed] };
    out.value = JSON.stringify(payload, null, 2);
  }

  build.addEventListener("click", buildJson);

  root.innerHTML = "";
  root.append(
    el("div", { class: "grid grid-2" }, [
      el("div", {}, [
        el("div", { class: "card card-soft" }, [
          el("h2", { class: "h2" }, [text("Embed builder")]),
          el("p", { class: "p dim" }, [text("Build a Discord embed payload you can paste into tools or future dashboards.")]),
          el("div", { class: "hr" }),
          el("div", { class: "grid grid-auto" }, [
            el("div", {}, [el("div", { class: "label" }, [text("Title")]), title]),
            el("div", {}, [el("div", { class: "label" }, [text("Color")]), color]),
            el("div", {}, [el("div", { class: "label" }, [text("Author")]), author]),
            el("div", {}, [el("div", { class: "label" }, [text("Footer")]), footer])
          ]),
          el("div", { class: "label mt" }, [text("Description")]),
          desc,
          el("div", { class: "row row-wrap mt" }, [build, copy])
        ])
      ]),
      el("div", {}, [
        el("div", { class: "card" }, [
          el("h2", { class: "h2" }, [text("Output")]),
          el("p", { class: "p dim" }, [text("JSON payload (embeds array).")]),
          el("div", { class: "hr" }),
          out
        ])
      ])
    ])
  );

  build.click();
}

async function initAgents() {
  const needs = Boolean(qs("[data-agents='available']")) || Boolean(qs("[data-invite-generator]"));
  if (!needs) return;

  let agents;
  try { agents = await fetchJson("/data/agents.json"); }
  catch { toast("Failed to load /data/agents.json", "warn"); return; }

  renderAgentLists(agents);
  renderInviteGenerator(agents);
}

function init() {
  mountShell();
  initAgents();
  renderCommands();
  renderEmbedBuilder();
}

init();
