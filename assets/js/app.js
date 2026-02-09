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

  const vaultOpen = hasVaultAccess();
  if (document.body) document.body.classList.toggle('vault-open', vaultOpen);

  const params = new URLSearchParams(location.search);
  if (params.has('vault')) {
    const mode = params.get('mode') || 'timed';
    const ttlMinutes = Number(params.get('ttl'));
    const ttlMs = Number.isFinite(ttlMinutes) && ttlMinutes > 0 ? ttlMinutes * 60 * 1000 : vaultDefaultTtlMs;
    setVaultAccess({mode, ttlMs});
  }

  if (vaultPath.startsWith('/open-source') && vaultPath !== '/open-source' && vaultPath !== '/open-source/') {
    if (!hasVaultAccess()) {
      const next = encodeURIComponent(location.pathname + location.search + location.hash);
      location.replace(`/open-source/?next=${next}`);
      return;
    }
  }
  const gateButtons = document.querySelectorAll('[data-gate-enter="vault"], [data-vault-enter]');
  if (gateButtons.length) {
    const gateParams = new URLSearchParams(location.search);
    const next = gateParams.get('next') || gateParams.get('return');
    gateButtons.forEach(btn=>{
      if (next) btn.setAttribute('href', next);
      btn.addEventListener('click', (e) => {
        const mode = btn.getAttribute('data-gate-mode') || btn.getAttribute('data-vault-mode') || 'timed';
        const ttlMinutes = Number(btn.getAttribute('data-gate-ttl') || btn.getAttribute('data-vault-ttl') || '');
        const ttlMs = Number.isFinite(ttlMinutes) && ttlMinutes > 0 ? ttlMinutes * 60 * 1000 : vaultDefaultTtlMs;
        setVaultAccess({mode, ttlMs});
      });
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
  if (brand && !brand.querySelector('.brand-sub')) {
    const sub = document.createElement('span');
    sub.className = 'brand-sub';
    sub.textContent = 'Manual';
    brand.appendChild(sub);
  }

  function markManualStage(){
    const footer = document.querySelector('footer');
    if (!footer) return;
    if (footer.querySelector('.manual-hint')) return;
    const text = footer.textContent || '';
    if (text.toLowerCase().includes('manual')) return;
    const hint = document.createElement('span');
    hint.className = 'manual-hint';
    hint.textContent = 'Manual stage';
    footer.appendChild(hint);
  }
  markManualStage();

  if (document.body && document.body.dataset.hscroll === 'on') {
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
      <div class="identity-ops">
        <span class="pill"><span class="status-dot off"></span>Systems offline</span>
        <span class="pill"><span class="status-dot dev"></span>Builds in development</span>
        <a class="btn ghost" href="/technology/status/">Status</a>
        <a class="btn ghost" href="/projects/">Projects</a>
        <a class="btn ghost" href="/open-source/">Vault</a>
      </div>
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
      if (a.classList.contains("shelf-item")) continue;
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
  document.querySelectorAll('.cmd-link').forEach(link=>{
    link.textContent = 'Search';
    link.setAttribute('aria-label', 'Open site search');
  });
  const themes = ["dark","light","mono","amber","nikita"];
  const settingsKey = 'siteSettings';
  const defaultSettings = {
    theme: 'dark',
    format: 'default',
    motion: 'auto',
    compact: false,
    net: true,
    breadcrumbs: true,
    progress: false,
    tooltips: true
  };
  function loadSettings(){
    try {
      const raw = localStorage.getItem(settingsKey);
      if (!raw) return {...defaultSettings};
      return {...defaultSettings, ...JSON.parse(raw)};
    } catch {
      return {...defaultSettings};
    }
  }
  function saveSettings(next){
    localStorage.setItem(settingsKey, JSON.stringify(next));
  }
  let settings = loadSettings();
  if (settings.theme === 'list') {
    settings.theme = 'light';
    settings.format = 'list';
  }
  const saved = localStorage.getItem("theme");
  const savedTheme = saved === 'list' ? 'light' : saved;
  const preferTheme = settings.theme || savedTheme || "dark";
  if (themes.includes(preferTheme)) {
    root.setAttribute("data-theme", preferTheme);
  } else {
    root.setAttribute("data-theme", "dark");
  }
  settings.theme = root.getAttribute("data-theme") || "dark";
  if (location.pathname.startsWith('/chopsticks')) {
    root.setAttribute('data-theme', 'chopsticks');
  }
  if (settings.format === 'list') {
    root.setAttribute('data-format', 'list');
  } else {
    root.removeAttribute('data-format');
  }
  saveSettings(settings);
  function setLabel(){
    if (!btn) return;
    const current = root.getAttribute("data-theme") || "dark";
    const labels = {
      dark: "Dark",
      light: "Light",
      mono: "Greyscale",
      amber: "Amber",
      nikita: "Nikita"
    };
    btn.textContent = labels[current] || "Theme";
  }
  if (btn) {
    btn.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || "dark";
      const idx = themes.indexOf(current);
      const next = themes[(idx + 1) % themes.length];
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      settings.theme = next;
      saveSettings(settings);
      setLabel();
    });
  }
  setLabel();

  function applySettings(){
    const body = document.body;
    if (!body) return;
    if (settings.format === 'list') {
      root.setAttribute('data-format', 'list');
    } else {
      root.removeAttribute('data-format');
    }
    if (location.pathname.startsWith('/chopsticks')) {
      root.setAttribute('data-theme', 'chopsticks');
    }
    body.classList.toggle('compact', !!settings.compact);
    body.classList.toggle('no-net', settings.net === false);
    body.classList.toggle('reduced-motion', settings.motion === 'reduce');
    body.classList.toggle('has-trailbar', !!settings.breadcrumbs);
    const trail = document.querySelector('.trailbar');
    if (trail) trail.style.display = settings.breadcrumbs ? '' : 'none';
    const progress = document.querySelector('.progress-bar');
    if (progress) progress.style.display = 'none';
  }
  applySettings();

  function initSettingsLink(){
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;
    if (navActions.querySelector('[data-settings-link]')) return;
    // Menu toggle disabled; nav remains single-line with horizontal scroll.
    const a = document.createElement('a');
    a.className = 'btn ghost';
    a.href = '/settings/';
    a.dataset.settingsLink = '1';
    a.textContent = 'Settings';
    navActions.appendChild(a);
  }
  initSettingsLink();

  function adjustCommandLinks(){
    const inChopsticks = location.pathname.startsWith('/chopsticks');
    if (inChopsticks) return;
    document.querySelectorAll('.cmd-link,.cmd-hint').forEach(el=>el.remove());
  }
  adjustCommandLinks();

  // nav-open handling removed (menu toggle disabled)

  if (!document.querySelector('link[data-fa]')) {
    const fa = document.createElement('link');
    fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    fa.setAttribute('data-fa', '1');
    document.head.appendChild(fa);
  }
  if (!document.querySelector('link[data-tabler-icons]')) {
    const tabler = document.createElement('link');
    tabler.rel = 'stylesheet';
    tabler.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css';
    tabler.setAttribute('data-tabler-icons', '1');
    document.head.appendChild(tabler);
  }

  function buildAgentNodes(){
    const grids = document.querySelectorAll('[data-nodes-seq], [data-nodes-total]');
    grids.forEach(grid=>{
      if (grid.dataset.built) return;
      grid.classList.add('nodes-pool');
      const raw = grid.getAttribute('data-nodes-seq') || '';
      const total = Number(grid.getAttribute('data-nodes-total') || '0');
      const future = Number(grid.getAttribute('data-nodes-future') || '0');
      const fill = false;
      const unavailableRaw = grid.getAttribute('data-nodes-unavailable') || '';
      const specialId = grid.getAttribute('data-nodes-special') || '';
      const specialName = grid.getAttribute('data-nodes-special-name') || 'Custom Agent';
      const specialMapRaw = grid.getAttribute('data-nodes-special-map') || '';
      const specialMap = new Map();
      if (specialMapRaw) {
        specialMapRaw.split(',').map(v=>v.trim()).filter(Boolean).forEach(pair=>{
          const [idxRaw, nameRaw] = pair.split(':');
          const idx = Number((idxRaw || '').trim());
          const name = (nameRaw || '').trim();
          if (Number.isFinite(idx) && idx > 0 && name) {
            specialMap.set(String(idx), name);
          }
        });
      }
      const unavailable = new Set(unavailableRaw.split(',').map(v=>v.trim()).filter(Boolean));
      let seq = raw.split(',').map(v=>v.trim()).filter(Boolean);
      if (!seq.length && total) {
        seq = [];
        const full = total + future;
        for (let i = 1; i <= full; i += 1) {
          const id = String(i).padStart(4, '0');
          if (specialMap.has(String(i))) {
            seq.push('s');
          } else if (i <= total) {
            if (specialId && id === specialId) seq.push('s');
            else if (unavailable.has(id)) seq.push('r');
            else seq.push('g');
          } else {
            seq.push('x');
          }
        }
      }
      if (!seq.length) return;
      const link = grid.getAttribute('data-node-link') || '';
      const base = grid.getAttribute('data-node-base') || '';
      const inviteBase = grid.getAttribute('data-node-invite-base') || '';
      const frag = document.createDocumentFragment();
      seq.forEach((token, idx)=>{
        const color = token === 'g' ? 'green' : token === 'r' ? 'red' : token === 's' ? 'gold' : 'gray';
        const dot = document.createElement('span');
        dot.className = `node-dot ${color}`;
        dot.setAttribute('aria-label', 'Agent node');
        const id = String(idx + 1).padStart(4, '0');
        if (idx < total) {
          if (base) dot.dataset.link = `${base}${id}`;
          else if (link) dot.dataset.link = link;
          if (inviteBase) dot.dataset.invite = `${inviteBase}${id}`;
          dot.dataset.agentId = id;
          dot.dataset.servers = String(12 + (Number(id) * 7) % 120);
        } else {
          dot.dataset.nodeFuture = '1';
        }
        dot.dataset.nodeIndex = String(idx + 1);
        dot.dataset.nodeStatus = color;
        if (color === 'gold') {
          const mapped = specialMap.get(String(idx + 1));
          dot.dataset.specialName = mapped || specialName;
        }
        dot.style.animation = 'none';
        frag.appendChild(dot);
      });
      grid.appendChild(frag);
      grid.dataset.built = '1';
    });
    layoutAllBattlefields();
    enableBattlefieldOrdering();
    setupNodeMenus();
    initBattlefieldWater();
    initNodeFlow();
    initNodeCycle();
    initNodeDrift();
    initBattlefieldArrangements();
    initNodeSnake();
    renderNodeCounts();
  }
  buildAgentNodes();

  function initBattlefieldWater(){
    const grids = document.querySelectorAll('.battlefield-grid[data-nodes-flow]');
    grids.forEach(grid=>{
      if (grid.dataset.waterReady) return;
      grid.classList.add('water');
      const canvas = document.createElement('canvas');
      canvas.className = 'battlefield-water';
      grid.prepend(canvas);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      let w = 0, h = 0, dpr = 1, t = 0;
      const resize = ()=>{
        const rect = grid.getBoundingClientRect();
        dpr = Math.min(2, window.devicePixelRatio || 1);
        w = rect.width; h = rect.height;
        canvas.width = Math.max(1, Math.floor(w * dpr));
        canvas.height = Math.max(1, Math.floor(h * dpr));
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr,0,0,dpr,0,0);
      };
      resize();
      window.addEventListener('resize', resize);
      function draw(){
        t += 0.004;
        ctx.clearRect(0,0,w,h);
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0,'rgba(18,32,52,0.6)');
        grad.addColorStop(0.5,'rgba(8,18,30,0.45)');
        grad.addColorStop(1,'rgba(4,10,18,0.55)');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,w,h);
        const waveCount = 5;
        for (let i = 0; i < waveCount; i += 1) {
          const xBase = (w / (waveCount + 1)) * (i + 1);
          ctx.beginPath();
          for (let y = 0; y <= h; y += 12) {
            const amp = 6 + i * 1.6;
            const x = xBase + Math.sin((y / h) * Math.PI * 2 + t * (1.1 + i * 0.15)) * amp;
            ctx.lineTo(x, y);
          }
          ctx.strokeStyle = `rgba(90,214,255,${0.08 + i * 0.02})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        const sparkCount = 60;
        for (let i = 0; i < sparkCount; i += 1) {
          const x = (i * 53 + t * 140) % w;
          const y = (i * 37) % h;
          ctx.fillStyle = `rgba(120,220,255,${0.08 + (i % 5) * 0.02})`;
          ctx.fillRect(x, y, 1.4, 1.4);
        }
        grid._waterTime = t;
        requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
      grid.dataset.waterReady = '1';
    });
  }

  function initNodeFlow(){
    return;
  }

  function initNodeCycle(){
    const grids = document.querySelectorAll('.battlefield-grid[data-nodes-cycle]');
    grids.forEach(grid=>{
      if (grid.dataset.cycleReady) return;
      const nodes = Array.from(grid.querySelectorAll('.node-dot'));
      if (!nodes.length) return;
      const total = Number(grid.getAttribute('data-nodes-total') || '0');
      const unavailableRaw = grid.getAttribute('data-nodes-unavailable') || '';
      const unavailableCount = unavailableRaw.split(',').map(v=>v.trim()).filter(Boolean).length;
      const specialMapRaw = grid.getAttribute('data-nodes-special-map') || '';
      const specialCount = specialMapRaw ? specialMapRaw.split(',').map(v=>v.trim()).filter(Boolean).length : 0;
      const greenCount = Math.max(0, total - unavailableCount - specialCount);
      const redCount = Math.max(0, Math.min(unavailableCount, total));
      const goldCount = Math.max(0, Math.min(specialCount, total));
      const activeTotal = greenCount + redCount + goldCount;
      if (!activeTotal) return;
      let offset = 0;
      const order = [
        {count: greenCount, status: 'green'},
        {count: redCount, status: 'red'},
        {count: goldCount, status: 'gold'}
      ];
      function setNodeStatus(node, status){
        node.classList.remove('green','red','gold','gray');
        node.classList.add(status);
        node.dataset.nodeStatus = status;
      }
      const tick = ()=>{
        if (!document.body.contains(grid)) return;
        nodes.forEach(node=>setNodeStatus(node, 'gray'));
        let idx = 0;
        order.forEach(group=>{
          for (let i = 0; i < group.count; i += 1) {
            const pos = (offset + idx) % nodes.length;
            const node = nodes[pos];
            if (node) setNodeStatus(node, group.status);
            idx += 1;
          }
        });
        offset = (offset + 1) % nodes.length;
        setTimeout(tick, 1200);
      };
      tick();
      grid.dataset.cycleReady = '1';
    });
  }

  function initNodeSnake(){
    const grids = document.querySelectorAll('.battlefield-grid[data-nodes-arrangement="snake"]');
    grids.forEach(grid=>{
      if (grid.dataset.snakeReady) return;
      const nodes = Array.from(grid.querySelectorAll('.node-dot'));
      if (!nodes.length) return;
      const rect = grid.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      layoutBattlefield(grid);
      const total = Number(grid.getAttribute('data-nodes-total') || '0');
      const unavailableRaw = grid.getAttribute('data-nodes-unavailable') || '';
      const unavailableCount = unavailableRaw.split(',').map(v=>v.trim()).filter(Boolean).length;
      const specialMapRaw = grid.getAttribute('data-nodes-special-map') || '';
      const specialCount = specialMapRaw ? specialMapRaw.split(',').map(v=>v.trim()).filter(Boolean).length : 0;
      const greenCount = Math.max(0, total - unavailableCount - specialCount);
      const redCount = Math.max(0, Math.min(unavailableCount, total));
      const goldCount = Math.max(0, Math.min(specialCount, total));
      const liveCount = Math.max(1, greenCount + redCount + goldCount);
      const snakeLen = Math.max(14, Math.min(nodes.length, Math.round(liveCount * 0.9)));
      const layoutMeta = grid._layout?.gridMeta || getBattlefieldGridMeta(nodes.length, rect.width, rect.height);
      const cols = layoutMeta.cols;
      const rows = layoutMeta.rows;
      const maxIndex = nodes.length - 1;
      const idxToRC = (idx)=>({r: Math.floor(idx / cols), c: idx % cols});
      const neighbors = (idx)=>{
        const {r, c} = idxToRC(idx);
        const next = [];
        if (r > 0) next.push(idx - cols);
        if (r < rows - 1) next.push(idx + cols);
        if (c > 0) next.push(idx - 1);
        if (c < cols - 1) next.push(idx + 1);
        return next.filter(i=>i >= 0 && i <= maxIndex);
      };
      let snake = [];
      const seed = Math.max(0, Math.min(maxIndex, Math.floor(Math.random() * nodes.length)));
      snake.push(seed);
      while (snake.length < Math.min(snakeLen, nodes.length)) {
        const head = snake[0];
        const next = neighbors(head).filter(i=>!snake.includes(i));
        if (!next.length) break;
        snake.unshift(next[Math.floor(Math.random() * next.length)]);
      }
      function setStatus(node, status){
        node.classList.remove('green','red','gold','gray');
        node.classList.add(status);
        node.dataset.nodeStatus = status;
      }
      const order = [
        {count: greenCount, status: 'green'},
        {count: redCount, status: 'red'},
        {count: goldCount, status: 'gold'}
      ];
      function paintSnake(){
        if (!document.body.contains(grid)) return;
        const paused = grid.dataset.snakePaused === '1';
        nodes.forEach(n=>setStatus(n, 'gray'));
        if (!paused) {
          const head = snake[0] ?? 0;
          const neck = snake[1];
          const tail = snake[snake.length - 1];
          let options = neighbors(head).filter(i=>i !== neck && !snake.includes(i));
          if (!options.length) {
            options = neighbors(head).filter(i=>i !== neck && i === tail);
          }
          if (!options.length) options = neighbors(head).filter(i=>i !== neck);
          if (!options.length) options = neighbors(head);
          const next = options.length
            ? options[Math.floor(Math.random() * options.length)]
            : head;
          snake.unshift(next);
          if (snake.length > snakeLen) snake.pop();
        }
        let painted = 0;
        order.forEach(group=>{
          for (let i = 0; i < group.count; i += 1) {
            if (painted >= snakeLen) return;
            const idx = snake[painted];
            const node = idx != null ? nodes[idx] : null;
            if (node) setStatus(node, group.status);
            painted += 1;
          }
        });
        setTimeout(paintSnake, 240);
      }
      paintSnake();
      grid.dataset.snakeReady = '1';
    });
  }

  function initNodeDrift(){
    const grids = document.querySelectorAll('.battlefield-grid[data-nodes-drift]');
    grids.forEach(grid=>{
      if (grid.dataset.driftReady) return;
      const nodes = Array.from(grid.querySelectorAll('.node-dot'));
      if (!nodes.length) return;
      const rect = grid.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const pad = grid._flowPad || 18;
      const speed = 6;
      const dir = 1;
      let offset = 0;
      let last = performance.now();
      const fill = grid.hasAttribute('data-nodes-fill');
      const size = Number(getComputedStyle(grid).getPropertyValue('--node-size').replace('px','')) || 10;
      const spacing = Math.max(10, size * 1.6);
      const virtualWidth = Math.max(rect.width * 2.2, spacing * nodes.length);
      nodes.forEach((node, idx)=>{
        if (!node.dataset.baseX) {
          node.dataset.baseX = fill ? String(idx * spacing) : String(Math.random() * virtualWidth);
        }
        if (!node.dataset.baseY) {
          node.dataset.baseY = String(Math.random() * rect.height);
        }
      });
      const tick = (now)=>{
        if (!document.body.contains(grid)) return;
        const dt = Math.min(64, now - last) / 1000;
        last = now;
        if (grid.dataset.webPaused === '1') {
          requestAnimationFrame(tick);
          return;
        }
        const width = rect.width || 1;
        const height = rect.height || 1;
        offset = (offset + dir * speed * dt) % Math.max(1, virtualWidth);
        nodes.forEach(node=>{
          const baseX = Number(node.dataset.baseX || node.dataset.x || 0);
          const baseY = Number(node.dataset.baseY || node.dataset.y || 0);
          const x = fill
            ? ((baseX + offset) % virtualWidth)
            : ((baseX + offset) % virtualWidth) - (virtualWidth - width) / 2;
          const y = Math.min(height - pad, Math.max(pad, baseY));
          node.style.left = `${x}px`;
          node.style.top = `${y}px`;
          node.dataset.x = String(x);
          node.dataset.y = String(y);
        });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      grid.dataset.driftReady = '1';
    });
  }

  function renderNodeCounts(){
    document.querySelectorAll('[data-node-counts]').forEach(box=>{
      const grid = box.closest('.agent-battlefield')?.querySelector('.battlefield-grid');
      if (!grid) return;
      const nodes = grid.querySelectorAll('.node-dot');
      const counts = {green:0, red:0, gold:0, gray:0};
      nodes.forEach(n=>{
        const status = n.dataset.nodeStatus || '';
        if (counts[status] !== undefined) counts[status] += 1;
      });
      const set = (key, val)=>{
        const el = box.querySelector(`[data-count="${key}"]`);
        if (el) el.textContent = String(val);
      };
      set('green', counts.green);
      set('red', counts.red);
      set('gold', counts.gold);
      set('gray', counts.gray);
    });
  }

  function enableBattlefieldOrdering(){
    const fields = document.querySelectorAll('.agent-battlefield');
    fields.forEach(field=>{
      if (field.dataset.orderReady) return;
      const grid = field.querySelector('.battlefield-grid');
      if (!grid) return;
      if (!grid.hasAttribute('data-nodes-orderable')) {
        field.dataset.orderReady = '1';
        return;
      }
      const controls = document.createElement('div');
      controls.className = 'battlefield-controls';
      const reorderBtn = document.createElement('button');
      reorderBtn.className = 'battlefield-toggle';
      reorderBtn.type = 'button';
      reorderBtn.textContent = 'Reorder';
      controls.appendChild(reorderBtn);
      field.insertBefore(controls, field.firstChild);

      const setOrdered = ()=>{
        grid.setAttribute('data-nodes-order', 'ordered');
        delete grid.dataset.disturbed;
        layoutBattlefield(grid);
      };
      reorderBtn.addEventListener('click', setOrdered);
      layoutBattlefield(grid);
      field.dataset.orderReady = '1';
    });
  }

  function initBattlefieldArrangements(){
    const fields = document.querySelectorAll('.agent-battlefield');
    fields.forEach(field=>{
      if (field.dataset.arrangementsReady) return;
      const grid = field.querySelector('.battlefield-grid');
      if (!grid) return;
      const list = (grid.getAttribute('data-nodes-arrangements') || '').split(',').map(v=>v.trim()).filter(Boolean);
      if (!list.length) return;
      const controls = document.createElement('div');
      controls.className = 'battlefield-controls';
      if (list.includes('snake')) {
        const pauseBtn = document.createElement('button');
        pauseBtn.className = 'battlefield-toggle ghost toggle';
        pauseBtn.type = 'button';
        pauseBtn.setAttribute('aria-label', 'Pause snake');
        const setPaused = (paused)=>{
          grid.dataset.snakePaused = paused ? '1' : '';
          pauseBtn.classList.toggle('active', paused);
          pauseBtn.setAttribute('aria-label', paused ? 'Play snake' : 'Pause snake');
        };
        setPaused(false);
        pauseBtn.addEventListener('click', ()=>{
          const paused = grid.dataset.snakePaused === '1';
          setPaused(!paused);
        });
        controls.appendChild(pauseBtn);
        const label = field.dataset.poolLabel || 'Agent Pool';
        const host = field.dataset.poolHost || '';
        const text = document.createElement('span');
        text.className = 'battlefield-label';
        text.textContent = host ? `${label} hosted by ${host}` : label;
        controls.appendChild(text);
      }
      const showArrangementToggles = !(list.length === 1 && list[0] === 'snake');
      list.forEach(key=>{
        if (!showArrangementToggles) return;
        const btn = document.createElement('button');
        btn.className = 'battlefield-toggle ghost';
        btn.type = 'button';
        btn.textContent = key === 'row' ? 'Rows' : key === 'stagger' ? 'Stagger' : key === 'grid' ? 'Grid' : key;
        btn.dataset.arrangement = key;
        btn.addEventListener('click', ()=>{
          grid.setAttribute('data-nodes-arrangement', key);
          controls.querySelectorAll('.battlefield-toggle').forEach(b=>{
            b.classList.toggle('active', b === btn);
          });
          layoutBattlefield(grid);
          if (key === 'snake') {
            grid.dataset.snakeReady = '';
            initNodeSnake();
          }
        });
        controls.appendChild(btn);
      });
      field.insertBefore(controls, field.firstChild);
      const current = grid.getAttribute('data-nodes-arrangement') || list[0];
      const active = Array.from(controls.querySelectorAll('.battlefield-toggle')).find(b=>b.dataset.arrangement === current) || controls.querySelector('.battlefield-toggle');
      if (active) active.click();
      field.dataset.arrangementsReady = '1';
    });
  }

  function enableBattlefieldExpand(){
    document.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape') closeBattlefieldOverlay();
    });
  }

  function openBattlefieldOverlay(field){
    if (!field) return;
    if (document.querySelector('[data-battlefield-overlay]')) return;
    const overlay = document.createElement('div');
    overlay.className = 'battlefield-overlay';
    overlay.setAttribute('data-battlefield-overlay', '1');
    overlay.innerHTML = `
      <div class="battlefield-overlay-inner">
        <div class="battlefield-overlay-head">
          <div class="kicker">Agent Field</div>
          <button class="btn ghost" type="button" data-battlefield-close>×</button>
        </div>
        <div class="battlefield-overlay-body"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    const body = overlay.querySelector('.battlefield-overlay-body');
    const closeBtn = overlay.querySelector('[data-battlefield-close]');
    const placeholder = document.createElement('div');
    placeholder.className = 'battlefield-placeholder';
    field.parentElement.insertBefore(placeholder, field);
    body.appendChild(field);
    field.classList.add('field-expanded');
    closeBtn.addEventListener('click', closeBattlefieldOverlay);
    overlay.addEventListener('click', (e)=>{
      if (e.target === overlay) closeBattlefieldOverlay();
    });
  }

  function closeBattlefieldOverlay(){
    const overlay = document.querySelector('[data-battlefield-overlay]');
    if (!overlay) return;
    const field = overlay.querySelector('.agent-battlefield');
    const placeholder = document.querySelector('.battlefield-placeholder');
    if (field && placeholder && placeholder.parentElement) {
      field.classList.remove('field-expanded');
      placeholder.parentElement.insertBefore(field, placeholder);
      placeholder.remove();
    }
    overlay.remove();
  }

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

  function buildAgentDirectory(){
    const dirs = document.querySelectorAll('[data-agent-directory]');
    dirs.forEach(dir=>{
      if (dir.dataset.built) return;
      const total = Number(dir.getAttribute('data-agent-total') || '35');
      const base = dir.getAttribute('data-agent-base') || '/chopsticks/agents/invite/?agent=';
      const unavailableRaw = dir.getAttribute('data-agent-unavailable') || '';
      const specialId = dir.getAttribute('data-agent-special') || '';
      const unavailable = new Set(unavailableRaw.split(',').map(v=>v.trim()).filter(Boolean));
      const frag = document.createDocumentFragment();
      for (let i = 1; i <= total; i += 1) {
        const id = String(i).padStart(4, '0');
        const card = document.createElement('button');
        card.type = 'button';
        const isUnavailable = unavailable.has(id);
        const isSpecial = specialId === id;
        const serverCount = 12 + (i * 7) % 120;
        card.className = `agent-card ${isSpecial ? 'special' : ''} ${isUnavailable ? 'unavailable' : 'available'}`;
        card.dataset.agentId = id;
        card.setAttribute('aria-label', `Agent ${id} invite`);
        card.innerHTML = `
          <div class="agent-card-head">
            <div class="agent-card-title">Agent ${id}</div>
            <div class="agent-card-status" data-agent-status>${isSpecial ? 'Custom' : (isUnavailable ? 'Busy' : 'Active')}</div>
          </div>
          <div class="agent-card-body">
            <span>Media</span>
            <span>Voice</span>
            <span>Queues</span>
            <span>Routing</span>
          </div>
          <div class="agent-card-meta">
            <span>${serverCount} servers</span>
            <span>${isUnavailable ? 'In use' : 'Open'}</span>
          </div>
          <div class="agent-card-actions">
            <span class="pill">Invite</span>
          </div>
        `;
        card.dataset.invite = `${base}${id}`;
        frag.appendChild(card);
      }
      dir.appendChild(frag);
      dir.dataset.built = '1';
    });
    bindAgentDirectory();
  }
  buildAgentDirectory();

  function initAgentInviteLists(){
    const lists = document.querySelectorAll('[data-agent-invite-list]');
    if (!lists.length) return;
    lists.forEach(list=>{
      const section = list.closest('.section');
      if (!section) return;
      const dir = section.parentElement?.querySelector('[data-agent-directory]');
      const total = Number(dir?.getAttribute('data-agent-total') || '35');
      const base = dir?.getAttribute('data-agent-base') || '/chopsticks/agents/invite/?agent=';
      const unavailableRaw = dir?.getAttribute('data-agent-unavailable') || '';
      const unavailable = new Set(unavailableRaw.split(',').map(v=>v.trim()).filter(Boolean));
      const genButtons = section.querySelectorAll('[data-invite-generate]');
      const copyBtn = section.querySelector('[data-invite-copy]');
      const downloadBtn = section.querySelector('[data-invite-download]');
      const countInput = section.querySelector('[data-invite-count]');
      const openBtn = section.querySelector('[data-invite-open]');

      function buildList(mode){
        const links = [];
        const maxCap = Math.min(total, 100);
        const raw = Number(countInput?.value || total);
        const cap = Math.max(0, Math.min(maxCap, raw));
        for (let i = 1; i <= total; i += 1) {
          const id = String(i).padStart(4, '0');
          if (mode === 'available' && unavailable.has(id)) continue;
          links.push(`${base}${id}`);
          if (links.length >= cap) break;
        }
        list.value = links.join('\n');
        return links;
      }

      genButtons.forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const mode = btn.getAttribute('data-mode') || 'all';
          buildList(mode);
        });
      });

      if (copyBtn) {
        copyBtn.addEventListener('click', async ()=>{
          if (!list.value.trim()) buildList('available');
          try {
            await navigator.clipboard.writeText(list.value);
            copyBtn.textContent = 'Copied';
            setTimeout(()=>{copyBtn.textContent = 'Copy';}, 1200);
          } catch {
            copyBtn.textContent = 'Open';
            setTimeout(()=>{copyBtn.textContent = 'Copy';}, 1200);
          }
        });
      }

      if (downloadBtn) {
        downloadBtn.addEventListener('click', ()=>{
          if (!list.value.trim()) buildList('available');
          const blob = new Blob([list.value], {type:'text/plain'});
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'agent-invites.txt';
          a.click();
          URL.revokeObjectURL(a.href);
        });
      }

      if (openBtn) {
        openBtn.addEventListener('click', ()=>{
          const links = list.value.trim() ? list.value.trim().split('\n') : buildList('available');
          const cap = Math.min(links.length, Math.max(0, Math.min(total, Number(countInput?.value || total), 100)));
          if (!cap) return;
          const batchSize = 6;
          const delay = 450;
          let opened = 0;
          function openBatch(){
            const end = Math.min(cap, opened + batchSize);
            for (let i = opened; i < end; i += 1) {
              window.open(links[i], '_blank', 'noopener');
            }
            opened = end;
            if (opened < cap) {
              setTimeout(openBatch, delay);
            }
          }
          openBatch();
        });
      }
    });
  }
  initAgentInviteLists();

  function initAgentFilters(){
    const filterButtons = document.querySelectorAll('[data-agent-filter]');
    if (!filterButtons.length) return;
    filterButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const mode = btn.getAttribute('data-agent-filter') || 'all';
        filterButtons.forEach(b=>b.classList.toggle('active', b === btn));
        document.querySelectorAll('.agent-directory .agent-card').forEach(card=>{
          const isSpecial = card.classList.contains('special');
          const isAvailable = card.classList.contains('available');
          const isUnavailable = card.classList.contains('unavailable');
          let show = true;
          if (mode === 'available') show = isAvailable;
          if (mode === 'unavailable') show = isUnavailable;
          if (mode === 'custom') show = isSpecial;
          card.style.display = show ? '' : 'none';
        });
      });
    });
    const first = filterButtons[0];
    if (first) first.click();
  }
  initAgentFilters();

  function linkAgentsToNodes(){
    const sections = document.querySelectorAll('[data-agent-section]');
    sections.forEach(section=>{
      const grid = section.querySelector('.battlefield-grid');
      const pool = section.querySelector('[data-agent-grid]');
      const directory = section.querySelector('[data-agent-directory]');
      const specials = section.querySelectorAll('[data-agent-special]');
      if (!grid) return;
      const nodes = Array.from(grid.querySelectorAll('.node-dot'));
      const pills = pool ? Array.from(pool.querySelectorAll('.agent-pill')) : [];
      const cards = directory ? Array.from(directory.querySelectorAll('.agent-card')) : [];
      const getNode = (index)=>nodes[Number(index) - 1];
      pills.forEach(pill=>{
        const idx = pill.dataset.agentIndex;
        const node = getNode(idx);
        if (!node) return;
        const on = ()=>{
          node.classList.add('boost');
        };
        const off = ()=>{
          node.classList.remove('boost');
        };
        pill.addEventListener('mouseenter', on);
        pill.addEventListener('mouseleave', off);
        pill.addEventListener('focus', on);
        pill.addEventListener('blur', off);
      });
      cards.forEach(card=>{
        const idx = card.dataset.agentId;
        const node = getNode(Number(idx));
        if (!node) return;
        const on = ()=>{
          node.classList.add('boost');
          card.classList.add('focus');
        };
        const off = ()=>{
          node.classList.remove('boost');
          card.classList.remove('focus');
        };
        card.addEventListener('mouseenter', on);
        card.addEventListener('mouseleave', off);
        card.addEventListener('focus', on);
        card.addEventListener('blur', off);
      });
      specials.forEach(block=>{
        const idx = block.dataset.agentId || block.dataset.agentSpecialIndex;
        const name = (block.dataset.agentSpecialName || '').trim();
        let node = idx ? getNode(Number(idx)) : null;
        if (!node && name) {
          node = nodes.find(n => (n.dataset.specialName || '').toLowerCase() === name.toLowerCase());
        }
        if (!node) {
          node = nodes.find(n => n.dataset.nodeStatus === 'gold');
        }
        if (!node) return;
        const on = ()=>{
          node.classList.add('boost');
          block.classList.add('focus');
        };
        const off = ()=>{
          node.classList.remove('boost');
          block.classList.remove('focus');
        };
        block.addEventListener('mouseenter', on);
        block.addEventListener('mouseleave', off);
        block.addEventListener('focus', on);
        block.addEventListener('blur', off);
      });

      nodes.forEach(node=>{
        const idx = node.dataset.agentId;
        const card = idx ? cards.find(c => c.dataset.agentId === idx) : null;
        const special = node.dataset.specialName
          ? Array.from(specials).find(s => (s.dataset.agentSpecialName || '').toLowerCase() === node.dataset.specialName.toLowerCase())
          : null;
        node.addEventListener('mouseenter', ()=>{
          if (card) card.classList.add('focus');
          if (special) special.classList.add('focus');
        });
        node.addEventListener('mouseleave', ()=>{
          if (card) card.classList.remove('focus');
          if (special) special.classList.remove('focus');
        });
      });
    });
  }
  linkAgentsToNodes();

  function linkNodesToAgents(){
    const sections = document.querySelectorAll('[data-agent-section]');
    sections.forEach(section=>{
      const grid = section.querySelector('.battlefield-grid');
      if (!grid) return;
      const cards = Array.from(section.querySelectorAll('.agent-card'));
      const specials = Array.from(section.querySelectorAll('[data-agent-special]'));
      const cardById = new Map(cards.map(card => [card.dataset.agentId, card]));
      grid.querySelectorAll('.node-dot').forEach(node=>{
        const id = node.dataset.agentId;
        const card = id ? cardById.get(id) : null;
        if (card) {
          node.addEventListener('mouseenter', ()=>card.classList.add('active'));
          node.addEventListener('mouseleave', ()=>card.classList.remove('active'));
        }
        if (node.dataset.nodeStatus === 'gold' && specials.length) {
          node.addEventListener('mouseenter', ()=>{
            specials.forEach(s=>s.classList.add('active'));
          });
          node.addEventListener('mouseleave', ()=>{
            specials.forEach(s=>s.classList.remove('active'));
          });
        }
      });
    });
  }
  linkNodesToAgents();

  function bindAgentDirectory(){
    const dirs = document.querySelectorAll('[data-agent-directory]');
    dirs.forEach(dir=>{
      const detail = dir.closest('main')?.querySelector('[data-agent-detail]');
      const specialId = dir.getAttribute('data-agent-special') || '';
      function renderDetail(id){
        if (!detail) return;
        const isSpecial = id === specialId;
        detail.innerHTML = `
          <div class="h3">Agent ${id}${isSpecial ? ' · Custom' : ''}</div>
          <div class="muted">${isSpecial ? 'Custom persona layer with priority routing.' : 'Standard agent for media, voice, queues, and routing.'}</div>
          <div class="linklist" style="margin-top:8px">
            <span>Media</span>
            <span>Queues</span>
            <span>Voice</span>
            <span>${isSpecial ? 'Persona stack' : 'Channel routing'}</span>
          </div>
        `;
        dir.querySelectorAll('.agent-card').forEach(card=>{
          card.classList.toggle('active', card.dataset.agentId === id);
        });
      }
      dir.querySelectorAll('.agent-card').forEach(card=>{
        card.addEventListener('click', async (event)=>{
          const id = card.dataset.agentId;
          const invite = card.dataset.invite;
          renderDetail(id);
          if (id) location.hash = `agent/${id}`;
          if (!invite) return;
          if (event.metaKey || event.ctrlKey || event.shiftKey) {
            window.open(invite, '_blank', 'noopener');
            return;
          }
          const status = card.querySelector('[data-agent-status]');
          try {
            await navigator.clipboard.writeText(invite);
            if (status) {
              const prev = status.textContent;
              status.textContent = 'Copied';
              card.classList.add('copied');
              setTimeout(()=>{
                status.textContent = prev;
                card.classList.remove('copied');
              }, 1200);
            }
          } catch {
            window.open(invite, '_blank', 'noopener');
          }
        });
      });
      if (location.hash.startsWith('#agent/')) {
        const id = location.hash.replace('#agent/','');
        renderDetail(id);
        const target = dir.querySelector(`.agent-card[data-agent-id="${id}"]`);
        if (target) target.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
      }
    });
  }

  function getBattlefieldGridMeta(count, width, height){
    const pad = Math.max(6, Math.min(width, height) * 0.03);
    const usableW = Math.max(1, width - pad * 2);
    const usableH = Math.max(1, height - pad * 2);
    const aspect = usableW / usableH;
    const cols = Math.max(4, Math.ceil(Math.sqrt(count * aspect)));
    const rows = Math.max(2, Math.ceil(count / cols));
    const gapX = usableW / (cols + 1);
    const gapY = usableH / (rows + 1);
    return {pad, usableW, usableH, cols, rows, gapX, gapY};
  }

  function buildBattlefieldTargets(count, width, height, density = 1){
    const targets = [];
    if (!count || !width || !height) return targets;
    const meta = getBattlefieldGridMeta(count, width, height);
    const jitterX = 0;
    const jitterY = 0;
    for (let i = 0; i < count; i += 1) {
      const r = Math.floor(i / meta.cols);
      const c = i % meta.cols;
      const x = meta.pad + meta.gapX * (c + 1) + (Math.random() * jitterX - jitterX / 2);
      const y = meta.pad + meta.gapY * (r + 1) + (Math.random() * jitterY - jitterY / 2);
      targets.push({x, y});
    }
    return targets;
  }

  function buildRowTargets(count, width, height, spacing, stagger = false){
    const targets = [];
    if (!count || !width || !height) return targets;
    const pad = Math.max(6, spacing * 0.6);
    const usableW = Math.max(1, width - pad * 2);
    const usableH = Math.max(1, height - pad * 2);
    const cols = Math.max(1, Math.floor(usableW / spacing));
    const rows = Math.max(1, Math.ceil(count / cols));
    const rowGap = Math.max(1, usableH / Math.max(1, rows));
    for (let i = 0; i < count; i += 1) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const offset = stagger && r % 2 ? spacing * 0.5 : 0;
      const x = pad + c * spacing + offset;
      const y = pad + r * rowGap + rowGap * 0.5;
      targets.push({x, y});
    }
    return targets;
  }

  function buildRandomTargets(count, width, height, density = 1){
    const pad = Math.max(10, Math.min(width, height) * 0.05);
    const points = [];
    const maxTries = 60;
    const minDist = Math.max(12, 22 / Math.max(0.7, density));
    for (let i = 0; i < count; i += 1) {
      let placed = false;
      for (let t = 0; t < maxTries; t += 1) {
        const x = pad + Math.random() * (width - pad * 2);
        const y = pad + Math.random() * (height - pad * 2);
        let ok = true;
        for (let j = 0; j < points.length; j += 1) {
          const p = points[j];
          if (Math.hypot(x - p.x, y - p.y) < minDist) { ok = false; break; }
        }
        if (ok) {
          points.push({x, y});
          placed = true;
          break;
        }
      }
      if (!placed) {
        points.push({x: pad + Math.random() * (width - pad * 2), y: pad + Math.random() * (height - pad * 2)});
      }
    }
    return points;
  }

  function layoutBattlefield(grid, preserveNode){
    if (!grid) return;
    const nodes = Array.from(grid.querySelectorAll('.node-dot'));
    if (!nodes.length) return;
    const rect = grid.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const count = nodes.length;
    const baseSize = count > 140 ? 8 : count > 90 ? 9 : 10;
    grid.style.setProperty('--node-size', `${baseSize}px`);
    const densityAttr = grid.getAttribute('data-nodes-density');
    const density = densityAttr === 'dense' ? 1.35 : densityAttr === 'loose' ? 0.8 : 1;
    const order = (grid.getAttribute('data-nodes-order') || 'random').toLowerCase();
    const arrangement = (grid.getAttribute('data-nodes-arrangement') || 'row').toLowerCase();
    const spacing = baseSize * 1.6;

    const gridMeta = getBattlefieldGridMeta(count, rect.width, rect.height);
    let targets = [];
    const cached = grid._layout;
    if (cached && cached.order === order && cached.arrangement === arrangement && cached.count === nodes.length && Math.abs(cached.width - rect.width) < 1 && Math.abs(cached.height - rect.height) < 1) {
      targets = cached.targets;
    } else {
      if (arrangement === 'grid' || arrangement === 'snake') {
        targets = buildBattlefieldTargets(nodes.length, rect.width, rect.height, density);
      } else if (arrangement === 'stagger') {
        targets = buildRowTargets(nodes.length, rect.width, rect.height, spacing, true);
      } else if (arrangement === 'row') {
        targets = buildRowTargets(nodes.length, rect.width, rect.height, spacing, false);
      } else {
        targets = order === 'ordered'
          ? buildBattlefieldTargets(nodes.length, rect.width, rect.height, density)
          : buildRandomTargets(nodes.length, rect.width, rect.height, density);
      }
    }

    const pad = 4;
    const preserveIndex = preserveNode ? nodes.indexOf(preserveNode) : -1;
    const preserve = preserveIndex >= 0 ? {
      index: preserveIndex,
      x: Number(preserveNode.dataset.x || 0),
      y: Number(preserveNode.dataset.y || 0)
    } : null;
    if (preserve) {
      targets[preserve.index] = {x: preserve.x, y: preserve.y};
    }
    nodes.forEach((node, idx)=>{
      const t = targets[idx] || {x: 0, y: 0};
      const x = Math.max(pad, Math.min(rect.width - pad, t.x));
      const y = Math.max(pad, Math.min(rect.height - pad, t.y));
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.dataset.x = String(x);
      node.dataset.y = String(y);
      node.dataset.baseX = String(x);
      node.dataset.baseY = String(y);
      if (!node.dataset.floatSeed) {
        node.dataset.floatSeed = String(Math.random());
        const delay = Math.round(Math.random() * 60) / 10;
        node.style.animationDelay = `${delay}s`;
      }
    });
    grid._layout = {targets, order, arrangement, density, count: nodes.length, width: rect.width, height: rect.height, gridMeta};
    grid._flowPad = pad;
    grid._flowHeight = rect.height;
  }

  function layoutAllBattlefields(){
    document.querySelectorAll('.battlefield-grid').forEach(layoutBattlefield);
  }

  // vertical flow handled by initNodeFlow

  function scatterBattlefield(grid, exclude){
    if (!grid) return;
    const nodes = Array.from(grid.querySelectorAll('.node-dot'));
    if (!nodes.length) return;
    const rect = grid.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const densityAttr = grid.getAttribute('data-nodes-density');
    const density = densityAttr === 'dense' ? 1.2 : densityAttr === 'loose' ? 0.85 : 1;
    const targets = buildRandomTargets(nodes.length, rect.width, rect.height, density);
    if (exclude) {
      const idx = nodes.indexOf(exclude);
      if (idx >= 0) {
        targets[idx] = {x: Number(exclude.dataset.x || rect.width / 2), y: Number(exclude.dataset.y || rect.height / 2)};
      }
    }
    const pad = 14;
    nodes.forEach((node, idx)=>{
      const t = targets[idx] || {x: 0, y: 0};
      const x = Math.max(pad, Math.min(rect.width - pad, t.x));
      const y = Math.max(pad, Math.min(rect.height - pad, t.y));
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.dataset.x = String(x);
      node.dataset.y = String(y);
    });
    grid._layout = {targets, order:'random', density, count:nodes.length, width:rect.width, height:rect.height};
  }

  function enableNodeDragging(){
    document.querySelectorAll('.battlefield-grid').forEach(grid=>{
      if (grid.dataset.dragReady) return;
      if (!grid.hasAttribute('data-nodes-draggable')) {
        grid.dataset.dragReady = '1';
        return;
      }
      grid.querySelectorAll('.node-dot').forEach(node=>{
        node.addEventListener('pointerdown', (e)=>{
          if (e.button && e.button !== 0) return;
          e.preventDefault();
          node.dataset.dragging = '1';
          node.setPointerCapture(e.pointerId);
          const rect = grid.getBoundingClientRect();
          const startX = e.clientX - rect.left - Number(node.dataset.x || 0);
          const startY = e.clientY - rect.top - Number(node.dataset.y || 0);
          const originX = Number(node.dataset.x || 0);
          const originY = Number(node.dataset.y || 0);
          let moved = false;
          const pad = 14;
          const move = (ev)=>{
            const x = ev.clientX - rect.left - startX;
            const y = ev.clientY - rect.top - startY;
            const clampedX = Math.max(pad, Math.min(rect.width - pad, x));
            const clampedY = Math.max(pad, Math.min(rect.height - pad, y));
            if (!moved && Math.hypot(clampedX - originX, clampedY - originY) > 6) {
              moved = true;
            }
            node.style.left = `${clampedX}px`;
            node.style.top = `${clampedY}px`;
            node.dataset.x = String(clampedX);
            node.dataset.y = String(clampedY);
          };
          const up = ()=>{
            node.releasePointerCapture(e.pointerId);
            node.removeEventListener('pointermove', move);
            node.removeEventListener('pointerup', up);
            node.removeEventListener('pointercancel', up);
            delete node.dataset.dragging;
            if (moved) {
              node.dataset.moved = '1';
              node.dataset.recentDrag = '1';
              window.setTimeout(()=>{ delete node.dataset.recentDrag; }, 650);
              if (grid._webCompute) {
                const rect = grid.getBoundingClientRect();
                const target = grid._webCompute(node, rect);
                const currentX = Number(node.dataset.x || target.x);
                const currentY = Number(node.dataset.y || target.y);
                node.dataset.offsetX = String(currentX - target.x);
                node.dataset.offsetY = String(currentY - target.y);
              }
              if (!grid.dataset.disturbed) {
                grid.dataset.disturbed = '1';
                grid.setAttribute('data-nodes-order', 'random');
                scatterBattlefield(grid, node);
              } else {
                layoutBattlefield(grid, node);
              }
            }
          };
          node.addEventListener('pointermove', move);
          node.addEventListener('pointerup', up);
          node.addEventListener('pointercancel', up);
        });
      });
      grid.dataset.dragReady = '1';
    });
  }

  function setupNodeMenus(){
    const grids = document.querySelectorAll('.battlefield-grid');
    grids.forEach(grid=>{
      if (grid.dataset.nodeMenu) return;
      const menu = document.createElement('div');
      menu.className = 'node-menu';
      menu.innerHTML = `
        <div class="node-menu-core">
          <div class="node-menu-title">Agent</div>
          <div class="node-menu-sub muted"></div>
        </div>
        <div class="node-menu-actions">
          <button class="node-menu-btn node-menu-view" type="button">View</button>
          <a class="node-menu-btn node-menu-link" href="#">Invite</a>
        </div>
        <button class="close" type="button" aria-label="Close">×</button>
      `;
      menu.style.display = 'none';
      grid.appendChild(menu);
      let activeNode = null;
      const viewBtn = menu.querySelector('.node-menu-view');
      const inviteLink = menu.querySelector('.node-menu-link');
      function jumpToAgent(id){
        if (!id) return;
        const directory = document.querySelector('[data-agent-directory]');
        if (!directory) {
          window.location.assign(`/chopsticks/agents/#agent/${id}`);
          return;
        }
        const card = directory.querySelector(`.agent-card[data-agent-id="${id}"]`);
        if (card) {
          card.scrollIntoView({behavior:'smooth', block:'center'});
          card.classList.add('focus');
          setTimeout(()=>card.classList.remove('focus'), 1400);
        } else {
          window.location.assign(`/chopsticks/agents/#agent/${id}`);
        }
      }
      function showMenu(node){
        activeNode = node;
        if (activeNode) activeNode.dataset.hold = '1';
        const rect = grid.getBoundingClientRect();
        const nrect = node.getBoundingClientRect();
        let left = nrect.left - rect.left + 16;
        let top = nrect.top - rect.top + 16;
        const link = node.dataset.invite || node.dataset.link || grid.getAttribute('data-node-link') || '#';
        const sub = menu.querySelector('.node-menu-sub');
        menu.classList.remove('menu-green','menu-red','menu-gold','menu-gray');
        menu.classList.add(`menu-${node.dataset.nodeStatus || 'gray'}`);
        if (node.dataset.agentId) {
          const isCustom = node.dataset.nodeStatus === 'gold';
          if (isCustom) {
            const label = node.dataset.specialName || 'Custom Agent';
            sub.textContent = `${label} · Agent ${node.dataset.agentId}`;
          } else if (node.dataset.nodeStatus === 'red') {
            sub.textContent = `Busy · Agent ${node.dataset.agentId}`;
          } else {
            sub.textContent = `Active · Agent ${node.dataset.agentId}`;
          }
          if (inviteLink) {
            inviteLink.href = link;
            inviteLink.style.pointerEvents = '';
            inviteLink.classList.remove('disabled');
          }
          if (viewBtn) {
            viewBtn.disabled = false;
            viewBtn.classList.remove('disabled');
            viewBtn.onclick = () => jumpToAgent(node.dataset.agentId);
          }
        } else {
          const isCustom = node.dataset.nodeStatus === 'gold';
          if (isCustom) {
            const label = node.dataset.specialName || 'Custom Agent';
            sub.textContent = `${label} · Custom`;
            if (inviteLink) {
              inviteLink.href = '/chopsticks/agents/#custom';
              inviteLink.style.pointerEvents = '';
              inviteLink.classList.remove('disabled');
            }
            if (viewBtn) {
              viewBtn.disabled = false;
              viewBtn.classList.remove('disabled');
              viewBtn.onclick = () => window.location.assign('/chopsticks/agents/#custom');
            }
          } else {
            sub.textContent = 'Open agent slot';
            if (inviteLink) {
              inviteLink.href = '/support/contact/';
              inviteLink.style.pointerEvents = '';
              inviteLink.classList.remove('disabled');
            }
            if (viewBtn) {
              viewBtn.disabled = true;
              viewBtn.classList.add('disabled');
              viewBtn.onclick = null;
            }
          }
        }
        menu.style.display = 'grid';
        const menuRect = menu.getBoundingClientRect();
        const maxLeft = rect.width - menuRect.width - 8;
        const maxTop = rect.height - menuRect.height - 8;
        left = Math.max(8, Math.min(maxLeft, left));
        top = Math.max(8, Math.min(maxTop, top));
        menu.style.transform = `translate(${left}px, ${top}px)`;
      }
      let menuHover = false;
      let hideTimer = 0;
      const closeBtn = menu.querySelector('.close');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e)=>{
          e.preventDefault();
          e.stopPropagation();
          menuHover = false;
          nodeHover = false;
          hideMenu();
        });
      }
      function hideMenu(){
        menu.style.display = 'none';
        if (activeNode) activeNode.dataset.hold = '0';
        activeNode = null;
      }
      menu.addEventListener('mouseenter', ()=>{
        menuHover = true;
        if (hideTimer) clearTimeout(hideTimer);
        if (grid.dataset.webReady) grid.dataset.webPaused = '1';
      });
      menu.addEventListener('mouseleave', ()=>{
        menuHover = false;
        if (grid.dataset.webReady) grid.dataset.webPaused = '0';
      });
      const nodes = Array.from(grid.querySelectorAll('.node-dot'));
      nodes.forEach(node=>{
        node.addEventListener('mouseenter', ()=>{
          node.classList.add('hovering');
        });
        node.addEventListener('mouseleave', ()=>{
          node.classList.remove('hovering');
        });
        node.addEventListener('click', (e)=>{
          e.preventDefault();
          e.stopPropagation();
          if (node.dataset.dragging) return;
          if (activeNode === node && menu.style.display === 'grid') {
            hideMenu();
            if (grid.dataset.webReady) grid.dataset.webPaused = '0';
            return;
          }
          showMenu(node);
          menuHover = true;
          if (grid.dataset.webReady) grid.dataset.webPaused = '1';
        });
      });
      grid.addEventListener('mousemove', ()=>{
        if (hideTimer) clearTimeout(hideTimer);
      });
      document.addEventListener('click', (e)=>{
        if (!grid.contains(e.target)) return;
        if (e.target.classList.contains('node-dot')) return;
        if (e.target.closest('.node-menu')) return;
        menuHover = false;
        hideMenu();
        if (grid.dataset.webReady) grid.dataset.webPaused = '0';
      });
      grid.dataset.nodeMenu = '1';
    });
  }

  function enableNodeHoverNav(){
    const grids = document.querySelectorAll('.battlefield-grid');
    grids.forEach(grid=>{
      if (!grid.hasAttribute('data-node-hover-nav')) return;
      if (grid.dataset.nodeHoverNav) return;
      const hoverDelay = Number(grid.getAttribute('data-node-hover-delay') || 900);
      grid.querySelectorAll('.node-dot').forEach(node=>{
        let timer = 0;
        const clear = () => {
          if (timer) clearTimeout(timer);
          timer = 0;
        };
        node.addEventListener('mouseenter', ()=>{
          clear();
          timer = window.setTimeout(()=>{
            if (node.dataset.dragging || node.dataset.moved === '1' || node.dataset.recentDrag === '1') return;
            const link = node.dataset.link;
            if (link) window.location.assign(link);
          }, hoverDelay);
        });
        node.addEventListener('mouseleave', clear);
        node.addEventListener('pointerdown', clear);
      });
      grid.dataset.nodeHoverNav = '1';
    });
  }

  function relayoutOnResize(){
    layoutAllBattlefields();
    document.querySelectorAll('.battlefield-grid[data-nodes-flow]').forEach(grid=>{
      delete grid.dataset.flowReady;
      delete grid._flowTime;
    });
    initNodeFlow();
  }
  let resizeTimer = 0;
  window.addEventListener('resize', ()=>{
    if (resizeTimer) cancelAnimationFrame(resizeTimer);
    resizeTimer = requestAnimationFrame(relayoutOnResize);
  });
  window.addEventListener('load', ()=>{
    requestAnimationFrame(relayoutOnResize);
  });

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

  function bootEggs(){
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.querySelector('.egg-layer')) return;
    const layer = document.createElement('div');
    layer.className = 'egg-layer';
    document.body.appendChild(layer);
    const spawn = ()=>{
      const egg = document.createElement('div');
      egg.className = 'egg';
      if (Math.random() > 0.6) egg.classList.add('crack');
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const duration = 8 + Math.random() * 3;
      egg.style.left = `${left}vw`;
      egg.style.animationDelay = `${delay}s`;
      egg.style.animationDuration = `${duration}s`;
      layer.appendChild(egg);
      window.setTimeout(()=>egg.remove(), (delay + duration) * 1000);
    };
    spawn();
    window.setInterval(spawn, 7000);
  }
  bootEggs();

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
          if (mode === 'custom') pill.style.display = 'none';
        });
      });
      specials.forEach(card => {
        card.style.display = (mode === 'custom' || mode === 'all') ? '' : 'none';
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

  function initRequestModal(){
    const modal = document.querySelector('[data-request-modal]');
    if (!modal) return;
    const closeButtons = modal.querySelectorAll('[data-modal-close]');
    const status = modal.querySelector('[data-request-status]');
    const form = modal.querySelector('[data-request-form]');
    const open = ()=>{
      modal.classList.add('open');
      document.body.classList.add('modal-open');
    };
    const close = ()=>{
      modal.classList.remove('open');
      document.body.classList.remove('modal-open');
    };
    closeButtons.forEach(btn=>btn.addEventListener('click', close));
    modal.addEventListener('click', (e)=>{ if (e.target === modal) close(); });
    document.querySelectorAll('[data-request-open]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{ e.preventDefault(); open(); });
    });
    if (location.hash === '#request') open();
    window.addEventListener('hashchange', ()=>{
      if (location.hash === '#request') open();
    });
    if (form) {
      form.addEventListener('submit', (e)=>{
        e.preventDefault();
        if (status) status.textContent = 'Request saved locally. We will reach out through your contact.';
        form.reset();
      });
    }
  }
  initRequestModal();

  function addChopsticksLogos(){
    const links = document.querySelectorAll('a[href^="/chopsticks"]');
    links.forEach(a=>{
      if (a.dataset.chopLogo) return;
      if (a.querySelector('img')) return;
      if (a.closest('.logo-inline')) return;
      if (a.dataset.noChopLogo === '1') return;
      const icon = document.createElement('span');
      icon.className = 'mini-logo chopsticks';
      a.prepend(icon);
      a.dataset.chopLogo = "1";
    });
  }
  addChopsticksLogos();

  function initAtlasSearch(){
    const input = document.querySelector('[data-atlas-search]');
    if (!input) return;
    const items = Array.from(document.querySelectorAll('[data-atlas-item]'));
    if (!items.length) return;
    const matchItem = (item, q)=>{
      if (!q) return true;
      const tags = item.getAttribute('data-atlas-tags') || '';
      const hay = (item.textContent + ' ' + tags).toLowerCase();
      return hay.includes(q);
    };
    const apply = ()=>{
      const q = input.value.trim().toLowerCase();
      items.forEach(item=>{
        item.style.display = matchItem(item, q) ? '' : 'none';
      });
    };
    input.addEventListener('input', apply);
  }
  initAtlasSearch();

  function initTrailbar(){
    if (!settings.breadcrumbs) {
      document.body.classList.add('breadcrumbs-off');
      return;
    }
    document.body.classList.remove('breadcrumbs-off');
    document.body.classList.remove('has-trailbar');
    const isStartGate = location.pathname === '/' || location.pathname === '/start/' || location.pathname === '/start';
    if (isStartGate) return;
    if (document.body.classList.contains('pathbar-ready')) return;
    const map = {
      'home':'Home',
      'projects':'Projects',
      'chopsticks':'Chopsticks',
      'open-source':'Vault',
      'catalog':'Open Source Catalog',
      'docs':'Docs',
      'atlas':'Atlas',
      'embed':'Embed Builder',
      'studio':'Studio',
      'technology':'Technology',
      'support':'Support',
      'contribute':'Contribute',
      'settings':'Settings'
    };
    const segments = location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    const crumbs = [];
    let acc = '';
    segments.forEach(seg=>{
      acc += `/${seg}`;
      crumbs.push({label: map[seg] || seg.replace(/-/g,' '), href: acc + '/'});
    });
    const path = document.querySelector('.path');
    if (path) {
      const crumbWrap = document.createElement('div');
      crumbWrap.className = 'crumbs';
      const home = document.createElement('a');
      home.href = '/home/';
      home.textContent = 'Home';
      crumbWrap.appendChild(home);
      crumbs.forEach(crumb=>{
        const sep = document.createElement('span');
        sep.className = 'sep';
        sep.textContent = '/';
        const a = document.createElement('a');
        a.href = crumb.href;
        a.textContent = crumb.label;
        crumbWrap.appendChild(sep);
        crumbWrap.appendChild(a);
      });
      path.innerHTML = '';
      path.appendChild(crumbWrap);
      const header = document.querySelector('.nav');
      if (header && header.parentNode) {
        header.parentNode.insertBefore(path, header.nextSibling);
      }
      document.body.classList.add('pathbar-ready');
      document.body.classList.add('has-pathbar');
    }
  }
  initTrailbar();

  const siteGateKey = 'siteGateAccepted';
  function setSiteGateSeen(){
    localStorage.setItem(siteGateKey, '1');
  }
  function hasSiteGateSeen(){
    return localStorage.getItem(siteGateKey) === '1';
  }
  const isSiteGate = location.pathname === '/' || location.pathname === '/index.html';
  const isAsset = location.pathname.startsWith('/assets') || location.pathname.startsWith('/data') || location.pathname.startsWith('/backend');
  if (!isSiteGate && !isAsset && !hasSiteGateSeen()) {
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    location.replace(`/?next=${next}`);
  }
  const siteGateParams = new URLSearchParams(location.search);
  const siteGateNext = siteGateParams.get('next');
  document.querySelectorAll('[data-site-enter]').forEach(btn=>{
    if (siteGateNext) btn.setAttribute('href', siteGateNext);
    btn.addEventListener('click', ()=>setSiteGateSeen());
  });

  // Legacy vaultGate keys removed; use unified vault gate helpers above.

  function initProgressBar(){
    return;
  }
  initProgressBar();

  const commandRoutes = [
    {label:'Home', href:'/home/', tag:'core'},
    {label:'Projects', href:'/projects/', tag:'core'},
    {label:'Chopsticks', href:'/chopsticks/', tag:'bots'},
    {label:'Chopsticks Agents', href:'/chopsticks/agents/', tag:'bots'},
    {label:'Chopsticks Docs', href:'/chopsticks/docs/', tag:'bots'},
    {label:'Vault Gate', href:'/open-source/', tag:'vault'},
    {label:'Open Source Catalog', href:'/open-source/catalog/', tag:'vault'},
    {label:'Atlas', href:'/atlas/', tag:'nav'},
    {label:'Embed Builder', href:'/embed/', tag:'tools'},
    {label:'Docs', href:'/docs/', tag:'docs'},
    {label:'Support', href:'/support/', tag:'support'},
    {label:'Support Contact', href:'/support/contact/', tag:'support'},
    {label:'Settings', href:'/settings/', tag:'system'}
  ];
  function initCommandPalette(){
    if (document.querySelector('.cmdk')) return;
    const wrap = document.createElement('div');
    wrap.className = 'cmdk';
    wrap.innerHTML = `
      <div class="cmdk-panel">
        <div class="cmdk-head">
          <span class="pill">Search</span>
          <input type="text" placeholder="Search projects, rooms, tools, docs…"/>
          <span class="cmdk-count">0 results</span>
          <button class="cmdk-close" type="button" aria-label="Close">×</button>
        </div>
        <div class="cmdk-list"></div>
      </div>
    `;
    document.body.appendChild(wrap);
    const input = wrap.querySelector('input');
    const list = wrap.querySelector('.cmdk-list');
    const closeBtn = wrap.querySelector('.cmdk-close');
    const render = (q='')=>{
      const term = q.toLowerCase();
      list.innerHTML = '';
      const results = commandRoutes
        .filter(r => r.label.toLowerCase().includes(term) || r.tag.includes(term))
        .slice(0, 40);
      results.forEach(route=>{
          const item = document.createElement('div');
          item.className = 'cmdk-item';
          item.innerHTML = `<div>${route.label}</div><div class="tag">${route.tag}</div>`;
          item.addEventListener('click', ()=>location.href = route.href);
          list.appendChild(item);
        });
      const counter = document.querySelector('.cmdk-count');
      if (counter) counter.textContent = `${results.length} results`;
    };
    input.addEventListener('input', ()=>render(input.value));
    wrap.addEventListener('click', (e)=>{ if (e.target === wrap) closeCommandPalette(); });
    if (closeBtn) closeBtn.addEventListener('click', closeCommandPalette);
    render();
  }
  initCommandPalette();

  function openCommandPalette(){
    const wrap = document.querySelector('.cmdk');
    if (!wrap) return;
    wrap.classList.add('active');
    const input = wrap.querySelector('input');
    if (input) { input.value = ''; input.focus(); input.dispatchEvent(new Event('input')); }
  }
  function closeCommandPalette(){
    const wrap = document.querySelector('.cmdk');
    if (!wrap) return;
    wrap.classList.remove('active');
  }
  document.addEventListener('keydown', (e)=>{
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    const inField = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;
    if (!inField && ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/')) {
      e.preventDefault();
      openCommandPalette();
    }
    if (e.key === 'Escape') closeCommandPalette();
  });

  document.querySelectorAll('.cmd-link').forEach(link=>{
    link.addEventListener('click', (e)=>{
      e.preventDefault();
      openCommandPalette();
    });
  });
  document.querySelectorAll('[data-open-cmd]').forEach(link=>{
    if (link.dataset.cmdBound) return;
    link.dataset.cmdBound = '1';
    link.addEventListener('click', (e)=>{
      e.preventDefault();
      openCommandPalette();
    });
  });

  function bindPopouts(){
    document.querySelectorAll('.popout').forEach(pop=>{
      const close = pop.querySelector('.popout-close');
      if (close && !close.dataset.bound) {
        close.dataset.bound = '1';
        close.addEventListener('click', ()=>{
          pop.classList.add('hidden');
        });
      }
    });
  }
  bindPopouts();

  function initScrollProgress(){
    if (document.querySelector('.scroll-progress')) return;
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.innerHTML = '<div class="bar"></div>';
    document.body.prepend(bar);
    const inner = bar.querySelector('.bar');
    const update = ()=>{
      const doc = document.documentElement;
      const total = Math.max(1, doc.scrollHeight - doc.clientHeight);
      const pct = Math.min(100, Math.max(0, (doc.scrollTop / total) * 100));
      inner.style.width = `${pct}%`;
    };
    window.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update);
    update();
  }
  initScrollProgress();

  function initShelves(){
    document.querySelectorAll('[data-shelf]').forEach(shelf=>{
      if (shelf.dataset.ready) return;
      const track = shelf.querySelector('.shelf-track');
      if (!track) return;
      const controls = shelf.querySelector('.shelf-controls');
      if (controls) {
        const left = controls.querySelector('[data-shelf-left]');
        const right = controls.querySelector('[data-shelf-right]');
        const scrollBy = () => track.clientWidth * 0.8;
        if (left) left.addEventListener('click', ()=>track.scrollBy({left:-scrollBy(), behavior:'smooth'}));
        if (right) right.addEventListener('click', ()=>track.scrollBy({left:scrollBy(), behavior:'smooth'}));
      }
      shelf.dataset.ready = '1';
    });
  }
  initShelves();

  async function initCatalog(){
    const root = document.querySelector('[data-catalog]');
    if (!root) return;
    if (root.dataset.ready) return;
    try {
      const [catRes, listRes] = await Promise.all([
        fetch('/data/open-source/categories.json'),
        fetch('/data/open-source/catalog.json')
      ]);
      if (!catRes.ok || !listRes.ok) throw new Error('catalog fetch failed');
      const categories = await catRes.json();
      const items = await listRes.json();

      const categoryMap = new Map();
      (categories || []).forEach(cat=>{
        categoryMap.set(cat.id, {...cat, items: []});
      });
      (items || []).forEach(item=>{
        const bucket = categoryMap.get(item.category);
        if (bucket) bucket.items.push(item);
      });

      const rooms = Array.from(categoryMap.values()).filter(r=>r.items.length);
      const totalLinks = rooms.reduce((acc, c)=>acc + (c.items || []).length, 0);

      // extend command palette with catalog links
      items.forEach(item=>{
        if (!item || !item.url) return;
        const label = item.title || item.name || item.url;
        const tag = (item.category || 'vault').toLowerCase();
        if (!commandRoutes.find(r => r.href === item.url)) {
          commandRoutes.push({label, href:item.url, tag});
        }
      });

      const summary = document.createElement('div');
      summary.className = 'catalog-summary';
      summary.innerHTML = `
        <span>${rooms.length} rooms loaded</span>
        <span>${totalLinks} links indexed</span>
        <span>External links only</span>
      `;

      const shell = document.createElement('div');
      shell.className = 'catalog-shell';

      const rail = document.createElement('div');
      rail.className = 'catalog-rail';
      rail.innerHTML = `
        <div class="rail-title">Open Source Rooms</div>
        <div class="catalog-search">
          <input class="input" data-catalog-search placeholder="Search the catalog"/>
        </div>
        <div class="catalog-reveal">
          <button class="btn ghost" type="button" data-catalog-reveal>Reveal all descriptions</button>
        </div>
        <div class="room-tabs"></div>
      `;
      const roomTabs = rail.querySelector('.room-tabs');
      const revealBtn = rail.querySelector('[data-catalog-reveal]');

      const panels = document.createElement('div');
      panels.className = 'room-panels';

      const makeCard = (item, category)=>{
        const card = document.createElement('a');
        card.className = 'catalog-card';
        card.href = item.url;
        card.target = '_blank';
        card.rel = 'noopener';
        let domain = '';
        try { domain = new URL(item.url).hostname.replace(/^www\./,''); } catch {}
        card.innerHTML = `
          <div class="meta">${(category.label || '').toUpperCase()}</div>
          <div class="h3"><span class="logo-inline"><img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" alt=""/><span>${item.title || item.name}</span></span></div>
          <div class="catalog-pop">
            <div class="muted">${(item.tags || []).join(' · ')}</div>
            <div class="muted">${item.note || ''}</div>
          </div>
        `;
        return card;
      };

      const roomButtons = [];
      const allRoom = {id:'all', label:'All Rooms', summary:'Every room at once.', items: rooms.flatMap(r=>r.items || [])};
      const makeTab = (room, count)=>{
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'room-tab';
        btn.dataset.room = room.id;
        btn.innerHTML = `<span>${room.label}</span><span class="count">${count}</span>`;
        roomTabs.appendChild(btn);
        roomButtons.push(btn);
      };
      makeTab(allRoom, rooms.length);
      rooms.forEach(room=>makeTab(room, room.items.length));

      const roomMap = new Map(rooms.map(r=>[r.id, r]));
      const panelMap = new Map();
      let activeRoom = allRoom;
      let activeQuery = '';

      function setActiveButton(id){
        roomButtons.forEach(btn=>btn.classList.toggle('active', btn.dataset.room === id));
      }

      function renderRoomPanel(room, query){
        const panel = panelMap.get(room.id);
        if (!panel) return;
        const track = panel.querySelector('[data-room-track]');
        const meta = panel.querySelector('[data-room-meta]');
        const items = (room.items || []);
        const filtered = query ? items.filter(item=>{
          const hay = `${item.title || ''} ${item.name || ''} ${(item.tags || []).join(' ')} ${item.note || ''}`.toLowerCase();
          return hay.includes(query);
        }) : items;
        track.innerHTML = '';
        if (meta) {
          meta.innerHTML = `
            <span>${filtered.length} links</span>
            <span>${room.id === 'all' ? 'All rooms' : room.label}</span>
          `;
        }
        if (!filtered.length) {
          panel.classList.add('empty');
          track.innerHTML = '<div class="catalog-empty">No matches in this room.</div>';
          return;
        }
        panel.classList.remove('empty');
        const capCount = Math.min(filtered.length, 22);
        filtered.slice(0, capCount).forEach(item=>{
          const category = room.id === 'all' ? roomMap.get(item.category) || room : room;
          track.appendChild(makeCard(item, category));
        });
      }

      function openCatalogOverlay(room, query){
        if (document.querySelector('[data-catalog-overlay]')) return;
        const overlay = document.createElement('div');
        overlay.className = 'catalog-overlay';
        overlay.setAttribute('data-catalog-overlay', '1');
        overlay.innerHTML = `
          <div class="catalog-overlay-inner">
            <div class="catalog-overlay-head">
              <div>
                <div class="kicker">Open Source Room</div>
                <div class="h3">${room.label}</div>
              </div>
              <button class="btn ghost" type="button" data-catalog-close>×</button>
            </div>
            <div class="catalog-overlay-body"></div>
          </div>
        `;
        document.body.appendChild(overlay);
        const body = overlay.querySelector('.catalog-overlay-body');
        const closeBtn = overlay.querySelector('[data-catalog-close]');
        const items = (room.items || []).filter(item=>{
          if (!query) return true;
          const hay = `${item.title || ''} ${item.name || ''} ${(item.tags || []).join(' ')} ${item.note || ''}`.toLowerCase();
          return hay.includes(query);
        });
        const getCategory = (item)=>room.id === 'all' ? roomMap.get(item.category) || room : room;
        items.forEach(item=>body.appendChild(makeCard(item, getCategory(item))));
        const close = ()=>overlay.remove();
        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e)=>{ if (e.target === overlay) close(); });
      }

      const buildPanel = (room)=>{
        const panel = document.createElement('section');
        panel.className = 'room-panel';
        panel.dataset.room = room.id;
        panel.innerHTML = `
          <div class="room-head">
            <div>
              <div class="kicker">Room</div>
              <div class="h3">${room.label}</div>
              <div class="muted">${room.summary || ''}</div>
            </div>
            <div class="room-controls" data-room-meta></div>
          </div>
          <div class="room-track" data-room-track></div>
          <div class="room-foot">
            <button class="btn ghost room-more" type="button" data-room-expand>Open full room</button>
          </div>
        `;
        const expandBtn = panel.querySelector('[data-room-expand]');
        expandBtn.addEventListener('click', ()=>openCatalogOverlay(room, activeQuery));
        panels.appendChild(panel);
        panelMap.set(room.id, panel);
        return panel;
      };

      buildPanel(allRoom);
      rooms.forEach(buildPanel);
      if (revealBtn) {
        revealBtn.addEventListener('click', ()=>{
          root.classList.toggle('catalog-reveal-on');
        });
      }

      roomButtons.forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const id = btn.dataset.room;
          activeRoom = id === 'all' ? allRoom : roomMap.get(id);
          activeQuery = '';
          const input = rail.querySelector('[data-catalog-search]');
          if (input) input.value = '';
          setActiveButton(id);
          panels.querySelectorAll('.room-panel').forEach(panel=>{
            panel.classList.toggle('is-hidden', id !== 'all' && panel.dataset.room !== id);
          });
          panelMap.forEach((panel, key)=>{
            const room = key === 'all' ? allRoom : roomMap.get(key);
            renderRoomPanel(room, activeQuery);
          });
        });
      });

      const input = rail.querySelector('[data-catalog-search]');
      if (input) {
        input.addEventListener('input', ()=>{
          activeQuery = input.value.toLowerCase().trim();
          panelMap.forEach((panel, key)=>{
            const room = key === 'all' ? allRoom : roomMap.get(key);
            renderRoomPanel(room, activeQuery);
          });
          if (activeQuery) {
            panels.querySelectorAll('.room-panel').forEach(panel=>{
              panel.classList.remove('is-hidden');
            });
          } else if (activeRoom && activeRoom.id !== 'all') {
            panels.querySelectorAll('.room-panel').forEach(panel=>{
              panel.classList.toggle('is-hidden', panel.dataset.room !== activeRoom.id);
            });
          }
        });
      }

      setActiveButton('all');
      panels.querySelectorAll('.room-panel').forEach(panel=>{
        panel.classList.remove('is-hidden');
      });
      panelMap.forEach((panel, key)=>{
        const room = key === 'all' ? allRoom : roomMap.get(key);
        renderRoomPanel(room, activeQuery);
      });

      shell.appendChild(rail);
      shell.appendChild(panels);
      root.appendChild(summary);
      root.appendChild(shell);
      root.dataset.ready = '1';
    } catch (err) {
      root.innerHTML = '<div class="card"><div class="h3">Catalog unavailable</div><div class="muted">Load the catalog JSON to render shelves.</div></div>';
    }
  }
  initCatalog();

  function bindSettingsPage(){
    const root = document.querySelector('[data-settings]');
    if (!root) return;
    const themeButtons = root.querySelectorAll('[data-setting-theme]');
    const formatButtons = root.querySelectorAll('[data-setting-format]');
    const motionButtons = root.querySelectorAll('[data-setting-motion]');
    const compactToggle = root.querySelector('[data-setting-compact]');
    const netToggle = root.querySelector('[data-setting-net]');
    const breadcrumbToggle = root.querySelector('[data-setting-breadcrumbs]');
    const applyAndSave = () => { saveSettings(settings); applySettings(); };
    themeButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const val = btn.getAttribute('data-setting-theme');
        settings.theme = val;
        root.setAttribute('data-theme', val);
        document.documentElement.setAttribute('data-theme', val);
        localStorage.setItem('theme', val);
        themeButtons.forEach(b=>b.classList.toggle('active', b === btn));
        applyAndSave();
      });
    });
    motionButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const val = btn.getAttribute('data-setting-motion');
        settings.motion = val;
        motionButtons.forEach(b=>b.classList.toggle('active', b === btn));
        applyAndSave();
      });
    });
    formatButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const val = btn.getAttribute('data-setting-format');
        settings.format = val;
        formatButtons.forEach(b=>b.classList.toggle('active', b === btn));
        applyAndSave();
      });
    });
    themeButtons.forEach(btn=>{
      btn.classList.toggle('active', btn.getAttribute('data-setting-theme') === settings.theme);
    });
    motionButtons.forEach(btn=>{
      btn.classList.toggle('active', btn.getAttribute('data-setting-motion') === settings.motion);
    });
    formatButtons.forEach(btn=>{
      btn.classList.toggle('active', btn.getAttribute('data-setting-format') === settings.format);
    });
    const bindToggle = (el, key)=>{
      if (!el) return;
      el.addEventListener('click', ()=>{
        settings[key] = !settings[key];
        el.classList.toggle('active', !!settings[key]);
        applyAndSave();
        if (key === 'breadcrumbs' && settings[key]) initTrailbar();
      });
      el.classList.toggle('active', !!settings[key]);
    };
    bindToggle(compactToggle, 'compact');
    bindToggle(netToggle, 'net');
    bindToggle(breadcrumbToggle, 'breadcrumbs');
  }
  bindSettingsPage();

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
