(function(){
  const iconHref = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
  if (!document.querySelector(`link[href="${iconHref}"]`)) {
    const fa = document.createElement("link");
    fa.rel = "stylesheet";
    fa.href = iconHref;
    fa.crossOrigin = "anonymous";
    document.head.appendChild(fa);
  }

  const vaultPath = location.pathname;
  const vaultKey = 'vaultGateAccepted';
  const vaultModeKey = 'vaultGateMode';
  const vaultExpireKey = 'vaultGateExpiresAt';
  const vaultPermKey = 'vaultGatePermanent';
  const vaultSessionKey = 'vaultGateSession';
  const vaultDefaultTtlMs = 1000 * 60 * 60 * 2;

  function setVaultAccess({mode = 'timed', ttlMs = vaultDefaultTtlMs} = {}) {
    localStorage.setItem(vaultKey, '1');
    localStorage.setItem(vaultModeKey, mode);
    if (mode === 'permanent') {
      localStorage.setItem(vaultPermKey, '1');
      localStorage.removeItem(vaultExpireKey);
    } else if (mode === 'session') {
      sessionStorage.setItem(vaultSessionKey, '1');
      localStorage.removeItem(vaultExpireKey);
    } else {
      const expiresAt = Date.now() + ttlMs;
      localStorage.setItem(vaultExpireKey, String(expiresAt));
      localStorage.removeItem(vaultPermKey);
    }
  }

  function hasVaultAccess() {
    if (sessionStorage.getItem(vaultSessionKey) === '1') return true;
    if (localStorage.getItem(vaultPermKey) === '1') return true;
    if (localStorage.getItem(vaultKey) !== '1') return false;
    const mode = localStorage.getItem(vaultModeKey) || 'timed';
    if (mode === 'timed') {
      const expiresAt = Number(localStorage.getItem(vaultExpireKey) || 0);
      if (!expiresAt || Date.now() > expiresAt) {
        localStorage.removeItem(vaultKey);
        localStorage.removeItem(vaultExpireKey);
        return false;
      }
    }
    return true;
  }

  const params = new URLSearchParams(location.search);
  if (params.has('vault')) {
    const mode = params.get('mode') || 'timed';
    const ttlMinutes = Number(params.get('ttl'));
    const ttlMs = Number.isFinite(ttlMinutes) && ttlMinutes > 0 ? ttlMinutes * 60 * 1000 : vaultDefaultTtlMs;
    setVaultAccess({mode, ttlMs});
  }

  if (vaultPath.startsWith('/open-source/') && vaultPath !== '/open-source/' && vaultPath !== '/open-source') {
    if (!hasVaultAccess()) {
      const next = encodeURIComponent(location.pathname + location.search + location.hash);
      location.replace(`/open-source/?next=${next}`);
      return;
    }
  }
  const gateEnter = document.querySelector('[data-gate-enter="vault"]');
  if (gateEnter) {
    const gateParams = new URLSearchParams(location.search);
    const next = gateParams.get('next');
    if (next) {
      gateEnter.setAttribute('href', next);
    }
    gateEnter.addEventListener('click', () => {
      setVaultAccess({});
    });
  }

  function markStatusCards(){
    if (!location.pathname.startsWith('/technology/status')) return;
    const cards = document.querySelectorAll('.grid .card');
    cards.forEach(card => {
      const muted = card.querySelector('.muted');
      if (!muted) return;
      const text = muted.textContent.trim().toLowerCase();
      let state = 'unknown';
      if (text.includes('operational') || text.includes('online') || text.includes('available')) state = 'up';
      if (text.includes('degraded') || text.includes('partial')) state = 'warn';
      if (text.includes('down') || text.includes('offline') || text.includes('unavailable')) state = 'down';
      card.dataset.status = state;
      const dot = document.createElement('span');
      dot.className = 'status-dot';
      dot.setAttribute('aria-hidden', 'true');
      muted.classList.add('status-text');
      muted.prepend(dot);
    });
  }
  markStatusCards();

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

  if (document.body && !document.body.classList.contains('hscroll-site')) {
    document.body.classList.add('hscroll-site');
  }

  const main = document.querySelector('main');
  const pathEl = document.querySelector('.path');
  const isStartGate = location.pathname === '/' || location.pathname === '/start/' || location.pathname === '/start';
  if (main && !isStartGate && !document.querySelector('.identity-band')) {
    const band = document.createElement('section');
    band.className = 'identity-band';
    band.innerHTML = `
      <div class="identity-brand"><span class="dot"></span><span>Wok Specialists</span></div>
      <div class="identity-tagline">One studio · many builds</div>
    `;
    if (pathEl) {
      pathEl.insertAdjacentElement('afterend', band);
    } else {
      main.prepend(band);
    }
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

  const revealTargets = document.querySelectorAll('[data-reveal], [data-stagger], .reveal, .stagger');
  if (revealTargets.length) {
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.hasAttribute('data-stagger')) el.classList.add('stagger');
        el.classList.add('visible');
        if (el.classList.contains('stagger')) {
          const kids = Array.from(el.children);
          kids.forEach((child, idx)=>child.style.setProperty('--delay', `${idx * 70}ms`));
        }
        io.unobserve(el);
      });
    }, {threshold:0.15});
    revealTargets.forEach(el=>io.observe(el));
  }

  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.setAttribute("aria-label", "Theme toggle");
  }
  const themes = ["mono","dark","light","neon"];
  const saved = localStorage.getItem("theme");
  if (themes.includes(saved)) {
    root.setAttribute("data-theme", saved);
  } else {
    root.setAttribute("data-theme", "mono");
  }
  function setLabel(){
    if (!btn) return;
    const current = root.getAttribute("data-theme") || "mono";
    const labels = {
      dark: "Dark",
      light: "Light",
      neon: "Arcade",
      mono: "Greyscale"
    };
    btn.textContent = labels[current] || "Theme";
  }
  if (btn) {
    btn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || "mono";
      const idx = themes.indexOf(current);
      const next = themes[(idx + 1) % themes.length];
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      setLabel();
    });
  }
  setLabel();

  if (!document.querySelector('link[data-fa]')) {
    const fa = document.createElement('link');
    fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    fa.setAttribute('data-fa', '1');
    document.head.appendChild(fa);
  }

  function buildAgentNodes(){
    const grids = document.querySelectorAll('[data-nodes-seq]');
    grids.forEach(grid=>{
      if (grid.dataset.built) return;
      const raw = grid.getAttribute('data-nodes-seq') || '';
      const seq = raw.split(',').map(v=>v.trim()).filter(Boolean);
      const link = grid.getAttribute('data-node-link') || '';
      const frag = document.createDocumentFragment();
      seq.forEach((token, idx)=>{
        const color = token === 'g' ? 'green' : token === 'r' ? 'red' : 'gold';
        let dot;
        if (link) {
          dot = document.createElement('a');
          dot.href = link;
          dot.className = `node-dot node-link ${color}`;
          dot.setAttribute('aria-label', 'Open agent pool');
        } else {
          dot = document.createElement('span');
          dot.className = `node-dot ${color}`;
        }
        dot.dataset.nodeIndex = String(idx + 1);
        dot.style.animation = 'glowPulse 2.2s ease-in-out infinite, nodeFloat 6s ease-in-out infinite';
        dot.style.animationDelay = `${(idx % 12) * 80}ms`;
        frag.appendChild(dot);
      });
      grid.appendChild(frag);
      grid.dataset.built = '1';
    });
    layoutBattlefieldNodes();
    enableNodeDragging();
  }
  buildAgentNodes();

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
        a.dataset.agentIndex = String(i);
        a.textContent = isUnavailable ? `Agent ${id} (Unavailable)` : `Agent ${id}`;
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

  function linkAgentsToNodes(){
    const sections = document.querySelectorAll('[data-agent-section]');
    sections.forEach(section=>{
      const grid = section.querySelector('.battlefield-grid');
      const pool = section.querySelector('[data-agent-grid]');
      if (!grid || !pool) return;
      const nodes = Array.from(grid.querySelectorAll('.node-dot'));
      const pills = Array.from(pool.querySelectorAll('.agent-pill'));
      const getNode = (index)=>nodes[Number(index) - 1];
      const refresh = typeof grid._renderHover === 'function' ? grid._renderHover : null;
      pills.forEach(pill=>{
        const idx = pill.dataset.agentIndex;
        const node = getNode(idx);
        if (!node) return;
        const on = ()=>{
          node.dataset.boost = '1';
          if (refresh) refresh();
        };
        const off = ()=>{
          node.dataset.boost = '0';
          if (refresh) refresh();
        };
        pill.addEventListener('mouseenter', on);
        pill.addEventListener('mouseleave', off);
        pill.addEventListener('focus', on);
        pill.addEventListener('blur', off);
      });
    });
  }
  linkAgentsToNodes();

  function layoutBattlefieldNodes(){
    const grids = document.querySelectorAll('.battlefield-grid');
    grids.forEach(grid=>{
      const rect = grid.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nodes = Array.from(grid.querySelectorAll('.node-dot'));
      const pad = 10;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const ring = Math.min(rect.width, rect.height) * 0.35;
      const spiralStep = (Math.PI * 2) / Math.max(1, nodes.length);
      nodes.forEach((node, idx)=>{
        if (node.dataset.placed) return;
        const angle = idx * spiralStep;
        const radius = ring * (0.55 + 0.45 * Math.sin(idx * 0.35));
        const jitterX = (Math.random() - 0.5) * 18;
        const jitterY = (Math.random() - 0.5) * 18;
        const x = cx + Math.cos(angle) * radius + jitterX;
        const y = cy + Math.sin(angle) * radius + jitterY;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        node.dataset.x = String(x);
        node.dataset.y = String(y);
        node.dataset.placed = '1';
      });
      // simple relaxation to reduce clumping
      for (let iter = 0; iter < 16; iter += 1) {
        for (let i = 0; i < nodes.length; i += 1) {
          const a = nodes[i];
          let ax = Number(a.dataset.x || 0);
          let ay = Number(a.dataset.y || 0);
          for (let j = i + 1; j < nodes.length; j += 1) {
            const b = nodes[j];
            let bx = Number(b.dataset.x || 0);
            let by = Number(b.dataset.y || 0);
            const dx = ax - bx;
            const dy = ay - by;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < 14) {
              const push = (14 - dist) * 0.5;
              const nx = dx / dist;
              const ny = dy / dist;
              ax += nx * push;
              ay += ny * push;
              bx -= nx * push;
              by -= ny * push;
              a.dataset.x = String(ax);
              a.dataset.y = String(ay);
              b.dataset.x = String(bx);
              b.dataset.y = String(by);
            }
          }
          clampNodeToGrid(a, grid);
        }
      }
    });
  }

  function clampNodeToGrid(node, grid){
    const rect = grid.getBoundingClientRect();
    const pad = 6;
    const x = Math.max(pad, Math.min(rect.width - pad, Number(node.dataset.x || 0)));
    const y = Math.max(pad, Math.min(rect.height - pad, Number(node.dataset.y || 0)));
    node.dataset.x = String(x);
    node.dataset.y = String(y);
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
  }

  function enableNodeDragging(){
    const grids = document.querySelectorAll('.battlefield-grid');
    grids.forEach(grid=>{
      if (grid.dataset.nodeDrag) return;
      const nodes = Array.from(grid.querySelectorAll('.node-dot'));
      nodes.forEach(node=>{
        node.addEventListener('pointerdown', (e)=>{
          if (e.button && e.button !== 0) return;
          e.preventDefault();
          node.setPointerCapture(e.pointerId);
          const rect = grid.getBoundingClientRect();
          const startX = e.clientX - rect.left - Number(node.dataset.x || 0);
          const startY = e.clientY - rect.top - Number(node.dataset.y || 0);
          function move(ev){
            const x = ev.clientX - rect.left - startX;
            const y = ev.clientY - rect.top - startY;
            node.dataset.x = String(x);
            node.dataset.y = String(y);
            clampNodeToGrid(node, grid);
          }
          function up(){
            node.removeEventListener('pointermove', move);
            node.removeEventListener('pointerup', up);
            node.removeEventListener('pointercancel', up);
          }
          node.addEventListener('pointermove', move);
          node.addEventListener('pointerup', up);
          node.addEventListener('pointercancel', up);
        });
      });
      grid.dataset.nodeDrag = '1';
    });
  }

  function relayoutOnResize(){
    const grids = document.querySelectorAll('.battlefield-grid');
    grids.forEach(grid=>{
      const nodes = Array.from(grid.querySelectorAll('.node-dot'));
      nodes.forEach(node=>{
        node.dataset.placed = '0';
      });
    });
    layoutBattlefieldNodes();
  }
  let resizeTimer = 0;
  window.addEventListener('resize', ()=>{
    if (resizeTimer) cancelAnimationFrame(resizeTimer);
    resizeTimer = requestAnimationFrame(relayoutOnResize);
  });
  window.addEventListener('load', ()=>{
    requestAnimationFrame(relayoutOnResize);
  });

  function setupBattlefieldHoverRipple(){
    const grids = document.querySelectorAll('.battlefield-grid');
    grids.forEach(grid=>{
      if (grid.dataset.ripple) return;
      const dots = Array.from(grid.querySelectorAll('.node-dot'));
      if (!dots.length) return;
      let raf = 0;
      let lastX = 0;
      let lastY = 0;
      function renderHover(){
        raf = 0;
        const rect = grid.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        if (!lastX && !lastY) {
          lastX = rect.left + rect.width / 2;
          lastY = rect.top + rect.height / 2;
        }
        dots.forEach(dot=>{
          const drect = dot.getBoundingClientRect();
          const dx = (drect.left + drect.width / 2) - lastX;
          const dy = (drect.top + drect.height / 2) - lastY;
          const dist = Math.hypot(dx, dy);
          const power = Math.max(0, 1 - dist / 140);
          const moveX = Math.max(-6, Math.min(6, dx * -0.02));
          const moveY = Math.max(-6, Math.min(6, dy * -0.02));
          const boost = dot.dataset.boost === '1' ? 0.5 : 0;
          const scale = Math.min(2.1, 1 + power * 0.6 + boost);
          dot.style.transform = `translate(${moveX}px, ${moveY}px) scale(${scale})`;
          dot.style.boxShadow = power > 0.05 || boost ? `0 0 ${10 + power * 18 + boost * 12}px rgba(255,255,255,.35)` : '';
          dot.style.filter = power > 0.05 || boost ? 'brightness(1.15)' : '';
        });
      }
      grid._renderHover = ()=>{
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(renderHover);
      };
      grid.addEventListener('mousemove', (e)=>{
        lastX = e.clientX;
        lastY = e.clientY;
        if (raf) return;
        raf = requestAnimationFrame(renderHover);
      });
      grid.addEventListener('mouseleave', ()=>{
        dots.forEach(dot=>{
          dot.style.transform = '';
          dot.style.boxShadow = '';
          dot.style.filter = '';
        });
      });
      grid.dataset.ripple = '1';
    });
  }
  setupBattlefieldHoverRipple();

  function bootLiquidNet(){
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.querySelector('.liquid-net')) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'liquid-net';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    document.body.appendChild(canvas);
    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles = [];
    let tick = 0;

    function makeGridPoints(){
      const area = w * h;
      const target = Math.min(140, Math.max(60, Math.floor(area / 28000)));
      const cols = Math.ceil(Math.sqrt(target * (w / h)));
      const rows = Math.ceil(target / cols);
      const cellW = w / cols;
      const cellH = h / rows;
      const list = [];
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const jitterX = (Math.random() - 0.5) * cellW * 0.45;
          const jitterY = (Math.random() - 0.5) * cellH * 0.45;
          list.push({
            x: c * cellW + cellW / 2 + jitterX,
            y: r * cellH + cellH / 2 + jitterY,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            phase: Math.random() * Math.PI * 2
          });
        }
      }
      return list;
    }

    function resize(){
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = makeGridPoints();
    }
    resize();
    window.addEventListener('resize', resize);

    function step(){
      tick += 0.01;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(120,140,180,0.14)';
      ctx.strokeStyle = 'rgba(120,140,180,0.08)';
      for (const p of particles) {
        const driftX = Math.cos(p.phase + tick) * 0.2;
        const driftY = Math.sin(p.phase + tick * 1.2) * 0.2;
        p.x += p.vx + driftX;
        p.y += p.vy + driftY;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 150) {
            ctx.globalAlpha = (1 - dist / 150) * 0.35;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 0.4;
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  bootLiquidNet();

  // drag-to-scroll removed per UX request

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
        filters.forEach(b => b.classList.toggle('active', b === btn));
      });
    });
    const defaultBtn = Array.from(filters).find(btn => btn.getAttribute('data-agent-filter') === 'all') || filters[0];
    if (defaultBtn) {
      setMode(defaultBtn.getAttribute('data-agent-filter'));
      filters.forEach(b => b.classList.toggle('active', b === defaultBtn));
    }
  }
  bindAgentFilters();

  function bindAgentWindows(){
    const wraps = document.querySelectorAll('[data-agent-window]');
    wraps.forEach(wrap=>{
      const label = wrap.querySelector('[data-agent-window-label]');
      const buttons = wrap.querySelectorAll('[data-agent-window-btn]');
      if (!label || !buttons.length) return;
      const key = 'agentWindow';
      const setWindow = (value) => {
        label.textContent = value;
        buttons.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-agent-window-btn') === value));
        localStorage.setItem(key, value);
      };
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const value = btn.getAttribute('data-agent-window-btn');
          setWindow(value);
        });
      });
      const saved = localStorage.getItem(key) || buttons[0].getAttribute('data-agent-window-btn');
      setWindow(saved);
    });
  }
  bindAgentWindows();

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
