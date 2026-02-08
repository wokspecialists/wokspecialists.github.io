(function(){
  const iconHref = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
  if (!document.querySelector(`link[href="${iconHref}"]`)) {
    const fa = document.createElement("link");
    fa.rel = "stylesheet";
    fa.href = iconHref;
    fa.crossOrigin = "anonymous";
    document.head.appendChild(fa);
  }
  const nav = document.querySelector('.nav');
  if (nav && location.pathname.startsWith('/open-source')) {
    const banner = document.createElement('section');
    banner.className = 'disclaimer';
    banner.innerHTML = `
      <div class="wrap">
        <strong>Third‑party directory. No safeguards.</strong>
        Wok Specialists does not own, host, or control linked resources and is not affiliated, sponsored, or endorsed by any listed site.
        Inclusion does not imply approval, and availability, accuracy, or safety is not guaranteed.
        This index is not filtered for content, risk, or legality.
        <details>
          <summary>Read the full warning</summary>
          <div>
            This index is informational and may include a wide range of resources, including content that is unsafe, offensive, or restricted
            in some locations. Users are responsible for verifying legality, safety, and compliance with local laws and each site’s terms.
            Wok Specialists does not provide warranties for external content and does not monitor or moderate third‑party destinations.
          </div>
        </details>
      </div>
    `;
    nav.insertAdjacentElement('afterend', banner);
  }

  const path = location.pathname.replace(/\/+$/, '') || '/';
  document.querySelectorAll('[data-nav]').forEach(a=>{
    const href = a.getAttribute('href').replace(/\/+$/, '') || '/';
    if (href === path) a.classList.add('active');
  });

  const projectLink = document.querySelector('.links a[href="/projects/"]');
  if (projectLink) projectLink.classList.add('projects-hot');

  const brand = document.querySelector('.brand');
  if (brand && !document.querySelector('.dev-pill')) {
    const pill = document.createElement('span');
    pill.className = 'dev-pill';
    pill.textContent = 'In development';
    brand.appendChild(pill);
  }

  function addLogos(){
    const links = document.querySelectorAll('a[href^="http"]');
    for (const a of links) {
      if (a.dataset.logo === "off") continue;
      if (a.classList.contains("btn")) continue;
      if (a.closest("nav")) continue;
      if (a.closest(".stack-nav")) continue;
      if (a.dataset.logoDone) continue;
      try {
        const url = new URL(a.href);
        const domain = url.hostname.replace(/^www\./, "");
        const img = document.createElement("img");
        img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        img.alt = "";
        a.classList.add("logo-link");
        a.prepend(img);
        a.dataset.logoDone = "1";
      } catch {}
    }
  }
  addLogos();

  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.title = "Light mode in development";
    btn.setAttribute("aria-label", "Theme toggle. Light mode in development.");
  }
  const themes = ["dark","light","mono","neon"];
  const saved = localStorage.getItem("theme");
  if (themes.includes(saved)) root.setAttribute("data-theme", saved);
  function setLabel(){
    if (!btn) return;
    btn.textContent = "Theme";
  }
  if (btn) {
    btn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || "dark";
      const idx = themes.indexOf(current);
      const next = themes[(idx + 1) % themes.length];
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      setLabel();
    });
  }
  setLabel();

  function buildAgentPools(){
    const pools = document.querySelectorAll('[data-agent-grid]');
    pools.forEach(pool=>{
      const total = Number(pool.getAttribute('data-agent-total') || '35');
      const base = pool.getAttribute('data-agent-base') || '/chopsticks/agents/invite/?agent=';
      const unavailableRaw = pool.getAttribute('data-agent-unavailable') || '';
      const unavailable = new Set(unavailableRaw.split(',').map(v=>v.trim()).filter(Boolean));
      if (pool.dataset.built) return;
      const frag = document.createDocumentFragment();
      const links = [];
      for (let i = 1; i <= total; i += 1) {
        const id = String(i).padStart(4, '0');
        const a = document.createElement('a');
        const isUnavailable = unavailable.has(id);
        a.className = `agent-pill ${isUnavailable ? 'unavailable' : 'available'}`;
        a.href = `${base}${id}`;
        a.textContent = isUnavailable ? `Agent ${id} (Unavailable)` : `Invite Agent ${id}`;
        if (isUnavailable) {
          a.setAttribute('aria-disabled', 'true');
          a.dataset.logo = 'off';
        }
        frag.appendChild(a);
        links.push(`${base}${id}`);
      }
      pool.appendChild(frag);
      pool.dataset.built = "1";
      const list = pool.closest('[data-agent-section]')?.querySelector('[data-agent-list]');
      if (list) list.value = links.join('\n');
    });
  }
  buildAgentPools();

  function bindAgentFilters(){
    const filters = document.querySelectorAll('[data-agent-filter]');
    if (!filters.length) return;
    const grids = document.querySelectorAll('[data-agent-grid]');
    const specials = document.querySelectorAll('[data-agent-special]');
    const setMode = (mode) => {
      grids.forEach(grid => {
        const pills = grid.querySelectorAll('.agent-pill');
        pills.forEach(pill => {
          const isUnavailable = pill.classList.contains('unavailable');
          const isAvailable = pill.classList.contains('available');
          if (mode === 'all') pill.style.display = '';
          if (mode === 'available') pill.style.display = isAvailable ? '' : 'none';
          if (mode === 'unavailable') pill.style.display = isUnavailable ? '' : 'none';
          if (mode === 'special') pill.style.display = 'none';
        });
      });
      specials.forEach(card => {
        card.style.display = (mode === 'special' || mode === 'all') ? '' : 'none';
      });
    };
    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-agent-filter');
        setMode(mode);
      });
    });
  }
  bindAgentFilters();

  function addChopsticksLogos(){
    const links = document.querySelectorAll('a[href^="/chopsticks"]');
    links.forEach(a=>{
      if (a.dataset.chopLogo) return;
      const icon = document.createElement('span');
      icon.className = 'mini-logo chopsticks';
      a.prepend(icon);
      a.dataset.chopLogo = "1";
    });
  }
  addChopsticksLogos();

  // Reveal on scroll
  const reveal = Array.from(document.querySelectorAll('[data-reveal], [data-stagger]'));
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reveal.length && !reduceMotion) {
    const io = new IntersectionObserver((entries)=>{
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    }, {threshold:0.15});
    reveal.forEach(el => io.observe(el));
  } else if (reduceMotion) {
    reveal.forEach(el => el.classList.add('is-visible'));
  }

  // Transparent redirect helper
  const redirectRoot = document.querySelector('[data-redirect]');
  if (redirectRoot) {
    const target = redirectRoot.getAttribute('data-redirect');
    const label = redirectRoot.querySelector('[data-redirect-label]');
    const link = redirectRoot.querySelector('[data-redirect-link]');
    if (label) label.textContent = target;
    if (link) link.href = target;
    let seconds = 4;
    const counter = redirectRoot.querySelector('[data-redirect-count]');
    const tick = () => {
      if (counter) counter.textContent = String(seconds);
      if (seconds <= 0) {
        location.href = target;
      } else {
        seconds -= 1;
        setTimeout(tick, 1000);
      }
    };
    tick();
  }
})();
