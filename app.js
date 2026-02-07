// app.js — one module file for the whole site

const SITE = {
  name: "Wok Specialists",
  nav: [
    { href: "/", label: "Home" },
    { href: "/chopsticks/", label: "Chopsticks" },
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

const PACKAGES = [
  { id: "starter", name: "Starter", agents: 1, useCase: "One voice channel at a time." },
  { id: "pro", name: "Pro", agents: 3, useCase: "Multiple simultaneous sessions." },
  { id: "enterprise", name: "Enterprise", agents: 6, useCase: "High concurrency pool." }
];

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
  // normalize: "/docs" -> "/docs/", "/docs/index.html" -> "/docs/"
  let out = (p || "/").replace(/index\.html$/, "");
  if (out !== "/" && !out.endsWith("/")) out += "/";
  return out;
}

function activePath() {
  return normalizePath(location.pathname || "/");
}

function buildHeader() {
  const p = activePath();

  const header = el("header", { class: "site-header" });

  const brand = el("a", { class: "brand", href: "/" }, [
    el("span", { class: "brand-mark", "aria-hidden": "true" }, [text("▣")]),
    el("span", { class: "brand-name" }, [text(SITE.name)])
  ]);

  const nav = el("nav", { class: "nav", "aria-label": "Primary" });
  const ul = el("ul", { class: "nav-list" });

  for (const item of SITE.nav) {
    const itemPath = normalizePath(item.href);
    const isActive = itemPath === p;
    ul.append(
      el("li", {}, [
        el("a", { href: item.href, class: `nav-link ${isActive ? "is-active" : ""}` }, [text(item.label)])
      ])
    );
  }

  nav.append(ul);
  header.append(brand, nav);
  return header;
}

function buildFooter() {
  return el("footer", { class: "site-footer" }, [
    el("div", { class: "footer-inner" }, [
      el("div", { class: "footer-left" }, [
        el("div", { class: "fine" }, [text("Wok Specialists")]),
        el("div", { class: "fine dim" }, [text("Chopsticks is a multi-agent Discord system.")])
      ]),
      el("div", { class: "footer-right" }, [
        el("a", { class: "footer-link", href: "/status/" }, [text("Status")]),
        el("a", { class: "footer-link", href: "/docs/" }, [text("Docs")])
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

  const t = el("div", { class: `toast toast-${kind}` }, [
    el("div", { class: "toast-body" }, [text(msg)])
  ]);

  host.append(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 200);
  }, 2600);
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

  const actions = el("div", { class: "card-actions" });

  const inviteBtn = el(
    "button",
    {
      class: `btn ${agent.status !== "available" ? "btn-disabled" : inviteConfigured ? "btn-primary" : "btn-muted"}`,
      disabled: agent.status !== "available" || !inviteConfigured,
      onClick: () => {
        if (!inviteUrl) return;
        window.open(inviteUrl, "_blank", "noopener,noreferrer");
      }
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
          toast("Copy failed. Select and copy manually.", "warn");
        }
      }
    },
    [text("Copy link")]
  );

  actions.append(inviteBtn, copyBtn);

  const tags = el(
    "div",
    { class: "tag-row" },
    (agent.tags || []).slice(0, 8).map(t => el("span", { class: "tag" }, [text(t)]))
  );

  const caps = el(
    "ul",
    { class: "caps" },
    (agent.capabilities || []).slice(0, 8).map(c => el("li", {}, [text(c)]))
  );

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
      el("div", {}, [
        el("div", { class: "label" }, [text("Capabilities")]),
        caps
      ]),
      el("div", {}, [
        el("div", { class: "label" }, [text("Actions")]),
        actions,
        !inviteConfigured && agent.status === "available"
          ? el("div", { class: "hint" }, [text("Invite not configured. Set clientId or inviteUrl in data/agents.json.")])
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

  if (hostAvail) {
    hostAvail.innerHTML = "";
    for (const a of available) hostAvail.append(renderAgentCard(a));
  }

  if (hostSoon) {
    hostSoon.innerHTML = "";
    for (const a of soon) hostSoon.append(renderAgentCard(a));
  }

  // If no coming-soon agents, collapse section cleanly
  if (soonWrap) {
    soonWrap.hidden = soon.length === 0;
  }
}

function normalizeSelection(agents, selectedAgentIds) {
  const map = new Map(agents.map(a => [a.agentId, a]));
  const selected = selectedAgentIds
    .map(id => map.get(id))
    .filter(Boolean)
    .filter(a => a.status === "available");

  const urls = selected
    .map(a => ({ agent: a, url: oauthInviteUrlFromAgent(a) }))
    .filter(x => Boolean(x.url));

  const missing = selected
    .map(a => ({ agent: a, url: oauthInviteUrlFromAgent(a) }))
    .filter(x => !x.url)
    .map(x => x.agent);

  return { selected, urls, missing };
}

function renderInviteGenerator(agents) {
  const root = qs("[data-invite-generator]");
  if (!root) return;

  const available = agents.filter(a => a.status === "available");

  const pkgRow = el("div", { class: "row row-wrap" });
  const pkgBtns = PACKAGES.map(p =>
    el(
      "button",
      { class: "btn btn-chip", dataset: { pkg: p.id }, onClick: () => setTargetCount(p.agents) },
      [text(`${p.name} (${p.agents})`)]
    )
  );
  pkgRow.append(...pkgBtns);

  const customWrap = el("div", { class: "row" });
  const customInput = el("input", {
    class: "input",
    type: "number",
    min: "1",
    step: "1",
    value: "2",
    "aria-label": "Agent count"
  });
  const customBtn = el(
    "button",
    { class: "btn btn-chip", onClick: () => setTargetCount(parseInt(customInput.value || "1", 10)) },
    [text("Set count")]
  );
  customWrap.append(el("div", { class: "label" }, [text("Custom count")]), customInput, customBtn);

  const list = el("div", { class: "checklist" });
  const checks = available.map(a => {
    const id = `chk-${a.agentId}`;
    const input = el("input", { id, type: "checkbox", class: "check", value: a.agentId, onChange: refreshOutput });
    const label = el("label", { for: id, class: "checkline" }, [
      el("span", { class: "checkname" }, [text(a.name)]),
      el("span", { class: "checkmeta" }, [text(oauthInviteUrlFromAgent(a) ? "Invite ready" : "Invite not configured")])
    ]);
    return el("div", { class: "checkrow" }, [input, label]);
  });
  for (const row of checks) list.append(row);

  const output = el("div", { class: "panel" });
  const outputTitle = el("div", { class: "panel-title" }, [text("Invites")]);
  const outputBody = el("textarea", { class: "textarea", rows: "8", readOnly: true, spellcheck: "false" });

  const warnBox = el("div", { class: "warnbox", hidden: true });

  const copyBtn = el(
    "button",
    {
      class: "btn btn-primary",
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(outputBody.value || "");
          toast("Invite list copied.", "ok");
        } catch {
          toast("Copy failed. Select and copy manually.", "warn");
        }
      }
    },
    [text("Copy invite list")]
  );

  const openAllBtn = el(
    "button",
    { class: "btn btn-ghost", onClick: () => openInvitesStaggered(parseInviteUrls(outputBody.value)) },
    [text("Open invites")]
  );

  output.append(outputTitle, outputBody, warnBox, el("div", { class: "row row-wrap" }, [copyBtn, openAllBtn]));

  const targetPanel = el("div", { class: "panel" });
  const targetTitle = el("div", { class: "panel-title" }, [text("Target concurrency")]);
  const targetText = el("div", { class: "p dim" }, [text("Select N Agents to deploy N simultaneous voice sessions in this server.")]);
  const targetCountLabel = el("div", { class: "big-count" }, [text("2")]);
  targetPanel.append(targetTitle, targetText, targetCountLabel, customWrap);

  root.innerHTML = "";
  root.append(
    el("div", { class: "grid-2" }, [
      el("div", {}, [
        el("div", { class: "label" }, [text("Package presets")]),
        pkgRow,
        el("div", { class: "label mt" }, [text("Select Agents")]),
        list
      ]),
      el("div", {}, [targetPanel, output])
    ])
  );

  function setTargetCount(n) {
    const target = Math.max(1, Number.isFinite(n) ? n : 1);
    targetCountLabel.textContent = String(target);

    const inputs = qsa("input[type='checkbox'].check", list);
    inputs.forEach((i, idx) => (i.checked = idx < target));
    refreshOutput();
  }

  function selectedAgentIds() {
    return qsa("input[type='checkbox'].check", list).filter(i => i.checked).map(i => i.value);
  }

  function refreshOutput() {
    const { urls, missing } = normalizeSelection(agents, selectedAgentIds());
    const lines = urls.map(x => `${x.agent.name} — ${x.url}`);
    outputBody.value = lines.join("\n");

    if (missing.length) {
      warnBox.hidden = false;
      warnBox.innerHTML = "";
      warnBox.append(
        el("div", { class: "warn-title" }, [text("Invites not configured")]),
        el("ul", { class: "warn-list" }, missing.map(a => el("li", {}, [text(a.name)]))),
        el("div", { class: "hint" }, [text("Set clientId or inviteUrl in data/agents.json.")])
      );
    } else {
      warnBox.hidden = true;
    }
  }

  setTargetCount(2);
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
    toast("No invite links to open.", "warn");
    return;
  }

  const delayMs = 650;
  let opened = 0;

  for (let i = 0; i < urls.length; i++) {
    setTimeout(() => {
      const w = window.open(urls[i], "_blank", "noopener,noreferrer");
      if (w) opened++;
      if (i === urls.length - 1) {
        if (opened === 0) toast("Popups blocked. Allow popups or use copied list.", "warn");
        else toast(`Opened ${opened}/${urls.length} invites.`, "ok");
      }
    }, i * delayMs);
  }
}

async function initAgents() {
  const pageNeedsAgents = Boolean(qs("[data-agents='available']")) || Boolean(qs("[data-invite-generator]"));
  if (!pageNeedsAgents) return;

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
