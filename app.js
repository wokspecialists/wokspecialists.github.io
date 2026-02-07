// app.js — one module file for the whole site

const ORG = {
  name: "Wok Specialists",
  githubOrgUrl: "https://github.com/Wok-Specialists"
};

const ROUTES = {
  chopsticks: "/chopsticks/",
  agents: "/chopsticks/agents/",
  packages: "/chopsticks/packages/",
  docs: "/chopsticks/docs/",
  status: "/chopsticks/status/"
};

const SITE = {
  nav: [
    { href: "/", label: "Home" },
    { href: ROUTES.chopsticks, label: "Chopsticks" },
    { href: "/agents/", label: "Agents" },
    { href: "/packages/", label: "Packages" },
    { href: "/docs/", label: "Docs" },
    { href: "/status/", label: "Status" }
  ],
  headerCtas: [{ href: "/agents/", label: "Invite Agents", variant: "primary" }]
};

const OAUTH = {
  base: "https://discord.com/api/oauth2/authorize",
  scope: "bot applications.commands",
  defaultPermissions: "36700160"
};

function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}
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
function text(s) {
  return document.createTextNode(s);
}

function normalizePath(p) {
  let out = (p || "/").replace(/index\.html$/, "");
  if (out !== "/" && !out.endsWith("/")) out += "/";
  return out;
}
function activePath() {
  return normalizePath(location.pathname || "/");
}

function iconSvg(name) {
  const common = `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  if (name === "github") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M9 19c-4 1.5-4-2.5-6-3m12 6v-3.5c0-1 .1-1.4-.5-2 2.2-.2 4.5-1.1 4.5-5 0-1.1-.4-2.1-1.1-2.9.1-.3.5-1.5-.1-3.1 0 0-.9-.3-3 1.1a10.4 10.4 0 0 0-5.4 0C7.3 4.2 6.4 4.5 6.4 4.5c-.6 1.6-.2 2.8-.1 3.1A4 4 0 0 0 5.2 10c0 3.9 2.3 4.8 4.5 5-.3.3-.5.7-.5 1.5V22"/></svg>`;
  }
  if (name === "docs") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M7 3h8l3 3v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path ${common} d="M15 3v4h4"/><path ${common} d="M8 11h8"/><path ${common} d="M8 15h8"/></svg>`;
  }
  return "";
}

function buildHeader() {
  const p = activePath();

  const header = el("header", { class: "site-header" });

  const brand = el("a", { class: "brand", href: "/" }, [
    el("span", { class: "brand-mark", "aria-hidden": "true" }, [text("▣")]),
    el("span", { class: "brand-name" }, [text(ORG.name)])
  ]);

  const nav = el("nav", { class: "nav", "aria-label": "Primary" });
  const ul = el("ul", { class: "nav-list" });

  for (const item of SITE.nav) {
    const itemPath = normalizePath(item.href);
    const isActive = itemPath === p;
    ul.append(el("li", {}, [el("a", { href: item.href, class: `nav-link ${isActive ? "is-active" : ""}` }, [text(item.label)])]));
  }

  nav.append(ul);

  const right = el("div", { class: "header-right" });

  const ctas = el("div", { class: "header-ctas" });
  for (const cta of SITE.headerCtas) {
    ctas.append(el("a", { href: cta.href, class: "btn btn-primary" }, [text(cta.label)]));
  }

  const icons = el("div", { class: "icon-links" }, [
    el("a", { class: "icon-btn", href: ORG.githubOrgUrl, target: "_blank", rel: "noopener noreferrer", title: "GitHub" }, [
      el("span", { class: "icon", html: iconSvg("github") })
    ]),
    el("a", { class: "icon-btn", href: "/docs/", title: "Docs" }, [
      el("span", { class: "icon", html: iconSvg("docs") })
    ])
  ]);

  right.append(ctas, icons);
  header.append(brand, nav, right);
  return header;
}

function buildFooter() {
  return el("footer", { class: "site-footer" }, [
    el("div", { class: "footer-inner" }, [
      el("div", { class: "footer-left" }, [
        el("div", { class: "fine" }, [text(ORG.name)]),
        el("div", { class: "fine dim" }, [text("A small team shipping practical projects across art, design, and technology.")])
      ]),
      el("div", { class: "footer-right" }, [
        el("a", { class: "footer-link", href: ROUTES.chopsticks }, [text("Chopsticks")]),
        el("a", { class: "footer-link", href: "/agents/" }, [text("Agents")]),
        el("a", { class: "footer-link", href: ORG.githubOrgUrl, target: "_blank", rel: "noopener noreferrer" }, [text("GitHub")])
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
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 200);
  }, 2400);
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

  const inviteBtn = el(
    "button",
    {
      class: `btn ${agent.status !== "available" ? "btn-disabled" : inviteConfigured ? "btn-green" : "btn-muted"}`,
      disabled: agent.status !== "available" || !inviteConfigured,
      onClick: () => inviteUrl && window.open(inviteUrl, "_blank", "noopener,noreferrer")
    },
    [text(inviteConfigured ? "Invite" : "Invite not configured")]
  );

  const copyBtn = el(
    "button",
    {
      class: `btn btn-ghost ${inviteConfigured ? "" : "btn-disabled"}`,
      disabled: !inviteConfigured,
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(inviteUrl);
          toast("Invite link copied.", "ok");
        } catch {
          toast("Copy failed.", "warn");
        }
      }
    },
    [text("Copy")]
  );

  const tags = el("div", { class: "tag-row" }, (agent.tags || []).slice(0, 10).map(t => el("span", { class: "tag" }, [text(t)])));
  const caps = el("ul", { class: "caps" }, (agent.capabilities || []).slice(0, 8).map(c => el("li", {}, [text(c)])));

  return el("article", { class: "card agent-card" }, [
    el("div", { class: "card-top" }, [
      el("div", { class: "card-title" }, [
        el("h3", { class: "h3" }, [text(agent.name || agent.agentId)]),
        el("span", { class: `badge ${statusClass}` }, [text(statusLabel)])
      ]),
      el("p", { class: "p dim" }, [text(agent.description || "")])
    ]),
    tags,
    el("div", { class: "card-split" }, [
      el("div", {}, [el("div", { class: "label" }, [text("Capabilities")]), caps]),
      el("div", {}, [
        el("div", { class: "label" }, [text("Actions")]),
        el("div", { class: "card-actions" }, [inviteBtn, copyBtn]),
        !inviteConfigured && agent.status === "available"
          ? el("div", { class: "hint" }, [text("Set clientId or inviteUrl in data/agents.json.")])
          : el("div", { class: "hint" }, [text(agent.status === "coming-soon" ? "Not deployable yet." : " ")])
      ])
    ])
  ]);
}

function renderAgentLists(agents) {
  const available = agents.filter(a => a.status === "available");
  const soon = agents.filter(a => a.status !== "available");

  const hostAvail = qs("[data-agents='available']");
  const hostSoon = qs("[data-agents='soon']");
  const soonWrap = qs("[data-section='soon']");
  const counts = qs("[data-agent-counts]");

  if (hostAvail) {
    hostAvail.innerHTML = "";
    available.forEach(a => hostAvail.append(renderAgentCard(a)));
  }
  if (hostSoon) {
    hostSoon.innerHTML = "";
    soon.forEach(a => hostSoon.append(renderAgentCard(a)));
  }
  if (soonWrap) soonWrap.hidden = soon.length === 0;

  if (counts) {
    counts.innerHTML = "";
    counts.append(
      el("span", { class: "stat" }, [el("span", { class: "stat-num" }, [text(String(available.length))]), text(" available")]),
      el("span", { class: "stat" }, [el("span", { class: "stat-num" }, [text(String(soon.length))]), text(" coming soon")])
    );
  }
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
  if (!urls.length) {
    toast("No invite links.", "warn");
    return;
  }
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

  const presets = [
    { label: "1", value: 1 },
    { label: "2", value: 2 },
    { label: "3", value: 3 },
    { label: "5", value: 5 }
  ];

  const presetRow = el("div", { class: "row row-wrap" }, presets.map(p =>
    el("button", { class: "btn btn-chip", onClick: () => setTargetCount(p.value) }, [text(p.label)])
  ));

  const customWrap = el("div", { class: "row" });
  const customInput = el("input", { class: "input", type: "number", min: "1", step: "1", value: "2" });
  const customBtn = el("button", { class: "btn btn-chip", onClick: () => setTargetCount(parseInt(customInput.value || "1", 10)) }, [text("Set")]);
  customWrap.append(el("div", { class: "label" }, [text("Custom")]), customInput, customBtn);

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
  const target = el("div", { class: "big-count" }, [text("2")]);

  const copyBtn = el("button", {
    class: "btn btn-green",
    onClick: async () => {
      try { await navigator.clipboard.writeText(out.value || ""); toast("Copied.", "ok"); }
      catch { toast("Copy failed.", "warn"); }
    }
  }, [text("Copy list")]);

  const openBtn = el("button", { class: "btn btn-red", onClick: () => openInvitesStaggered(parseInviteUrls(out.value)) }, [text("Open")]);

  root.innerHTML = "";
  root.append(el("div", { class: "grid-2" }, [
    el("div", {}, [
      el("div", { class: "panel" }, [
        el("div", { class: "panel-title" }, [text("Simultaneous channels")]),
        target,
        el("div", { class: "label mt" }, [text("Quick")]),
        presetRow,
        customWrap
      ]),
      el("div", { class: "panel" }, [
        el("div", { class: "panel-title" }, [text("Agents")]),
        list
      ])
    ]),
    el("div", {}, [
      el("div", { class: "panel" }, [
        el("div", { class: "panel-title" }, [text("Invites")]),
        out,
        warn,
        el("div", { class: "row row-wrap" }, [copyBtn, openBtn])
      ])
    ])
  ]));

  function setTargetCount(n) {
    const t = Math.max(1, Number.isFinite(n) ? n : 1);
    target.textContent = String(t);

    const inputs = qsa("input[type='checkbox'].check", list);
    inputs.forEach((i, idx) => (i.checked = idx < t));
    refreshOutput();
  }

  function selectedAgentIds() {
    return qsa("input[type='checkbox'].check", list).filter(i => i.checked).map(i => i.value);
  }

  function refreshOutput() {
    const map = new Map(agents.map(a => [a.agentId, a]));
    const selected = selectedAgentIds().map(id => map.get(id)).filter(Boolean).filter(a => a.status === "available");

    const urls = selected
      .map(a => ({ a, url: oauthInviteUrlFromAgent(a) }))
      .filter(x => Boolean(x.url));

    const missing = selected
      .map(a => ({ a, url: oauthInviteUrlFromAgent(a) }))
      .filter(x => !x.url)
      .map(x => x.a);

    out.value = urls.map(x => `${x.a.name} — ${x.url}`).join("\n");

    if (missing.length) {
      warn.hidden = false;
      warn.innerHTML = "";
      warn.append(
        el("div", { class: "warn-title" }, [text("Missing invites")]),
        el("ul", { class: "warn-list" }, missing.map(a => el("li", {}, [text(a.name)])))
      );
    } else {
      warn.hidden = true;
    }
  }

  setTargetCount(2);
}

async function initAgents() {
  const needs = Boolean(qs("[data-agents='available']")) || Boolean(qs("[data-invite-generator]"));
  if (!needs) return;

  let agents;
  try {
    agents = await fetchJson("/data/agents.json");
  } catch {
    toast("Failed to load data/agents.json", "warn");
    return;
  }

  renderAgentLists(agents);
  renderInviteGenerator(agents);
}

function init() {
  mountShell();
  initAgents();
}

init();
