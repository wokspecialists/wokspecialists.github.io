(async function(){
  const app = document.getElementById('vault-app');
  if (!app) return;

  const [catalog, categories, collections] = await Promise.all([
    fetch('/data/open-source/catalog.json').then(r=>r.json()),
    fetch('/data/open-source/categories.json').then(r=>r.json()),
    fetch('/data/open-source/collections.json').then(r=>r.json())
  ]);

  const state = {
    query: '',
    category: app.dataset.category || '',
    tag: '',
    collection: '',
    selected: ''
  };

  function parseHash(){
    const hash = location.hash.replace('#','');
    if (!hash) return;
    const [kind, value] = hash.split('/');
    if (kind === 'category') state.category = value || '';
    if (kind === 'collection') state.collection = value || '';
    if (kind === 'item') state.selected = value || '';
  }
  parseHash();
  window.addEventListener('hashchange', ()=>{
    state.category = '';
    state.collection = '';
    state.selected = '';
    parseHash();
    render();
  });

  const tagCounts = {};
  for (const item of catalog) {
    for (const tag of (item.tags || [])) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const tags = Object.keys(tagCounts).sort((a,b)=>tagCounts[b]-tagCounts[a]);

  const categoryMap = new Map(categories.map(c=>[c.id, c]));
  const collectionMap = new Map(collections.map(c=>[c.id, c]));

  const byId = new Map(catalog.map(i=>[i.id, i]));

  const searchInput = app.querySelector('[data-vault-search]');
  function jumpToResults(){
    if (!window.matchMedia('(max-width: 1100px)').matches) return;
    const results = app.querySelector('[data-vault-results]');
    if (results) results.scrollIntoView({behavior:'smooth', block:'start'});
  }
  if (searchInput) {
    searchInput.addEventListener('input', (e)=>{
      state.query = e.target.value.trim().toLowerCase();
      render();
    });
  }
  const clearBtn = app.querySelector('[data-vault-clear]');
  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', ()=>{
      state.query = '';
      searchInput.value = '';
      render();
      searchInput.focus();
    });
  }
  const resetBtn = app.querySelector('[data-vault-reset]');
  if (resetBtn && searchInput) {
    resetBtn.addEventListener('click', ()=>{
      state.query = '';
      state.category = '';
      state.collection = '';
      state.tag = '';
      searchInput.value = '';
      render();
      searchInput.focus();
    });
  }
  document.addEventListener('keydown', (e)=>{
    if (!searchInput) return;
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    e.preventDefault();
    searchInput.focus();
  });

  function renderFilters(){
    const catWrap = app.querySelector('[data-vault-categories]');
    const tagWrap = app.querySelector('[data-vault-tags]');
    const counts = {};
    for (const item of catalog) counts[item.category] = (counts[item.category] || 0) + 1;
    if (catWrap) {
      catWrap.innerHTML = '';
      const all = document.createElement('button');
      all.className = 'filter-chip' + (!state.category ? ' active' : '');
      all.textContent = `All (${catalog.length})`;
      all.addEventListener('click', ()=>{state.category='';state.collection='';render();jumpToResults();});
      catWrap.appendChild(all);
      for (const cat of categories) {
        const btn = document.createElement('button');
        btn.className = 'filter-chip' + (state.category === cat.id ? ' active' : '');
        const count = counts[cat.id] || 0;
        btn.textContent = `${cat.label} (${count})`;
        btn.addEventListener('click', ()=>{state.category = cat.id; state.collection=''; render();jumpToResults();});
        catWrap.appendChild(btn);
      }
    }
    if (tagWrap) {
      tagWrap.innerHTML = '';
      for (const tag of tags.slice(0, 36)) {
        const btn = document.createElement('button');
        btn.className = 'filter-chip' + (state.tag === tag ? ' active' : '');
        btn.textContent = `${tag} (${tagCounts[tag] || 0})`;
        btn.addEventListener('click', ()=>{state.tag = state.tag === tag ? '' : tag; render();jumpToResults();});
        tagWrap.appendChild(btn);
      }
    }
  }

  function filterItems(){
    let items = catalog.slice();
    if (state.collection) {
      const col = collectionMap.get(state.collection);
      if (col) items = col.items.map(id=>byId.get(id)).filter(Boolean);
    }
    if (state.category) items = items.filter(i=>i.category === state.category);
    if (state.tag) items = items.filter(i=>Array.isArray(i.tags) && i.tags.includes(state.tag));
    if (state.query) {
      const q = state.query;
      items = items.filter(i =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.note || '').toLowerCase().includes(q) ||
        (i.tags || []).some(t=>t.toLowerCase().includes(q))
      );
    }
    return items;
  }

  function renderCollections(){
    const wrap = app.querySelector('[data-vault-collections]');
    if (!wrap) return;
    wrap.innerHTML = '';
    for (const col of collections) {
      const card = document.createElement('div');
      card.className = 'vault-collection';
      card.innerHTML = `<h4>${col.title}</h4><div class="muted">${col.summary || ''}</div>`;
      card.addEventListener('click', ()=>{state.collection = col.id; state.category=''; render(); location.hash = `collection/${col.id}`; jumpToResults();});
      wrap.appendChild(card);
    }
  }

  function renderCounts(){
    const wrap = app.querySelector('[data-vault-counts]');
    if (!wrap) return;
    const counts = {};
    for (const item of catalog) counts[item.category] = (counts[item.category] || 0) + 1;
    wrap.innerHTML = '';
    for (const cat of categories) {
      const count = counts[cat.id] || 0;
      const a = document.createElement('a');
      a.href = `/open-source/catalog/#room-${cat.id}`;
      a.textContent = `${cat.label} (${count})`;
      wrap.appendChild(a);
    }
  }

  function renderMeta(){
    const totalNodes = app.querySelectorAll('[data-vault-total]');
    totalNodes.forEach(n => n.textContent = String(catalog.length));
    const metaNodes = app.querySelectorAll('[data-vault-meta]');
    metaNodes.forEach(n => {
      const kind = n.getAttribute('data-vault-meta');
      if (kind === 'categories') n.textContent = String(categories.length);
      if (kind === 'collections') n.textContent = String(collections.length);
      if (kind === 'tags') n.textContent = String(tags.length);
    });
  }

  function renderResults(){
    const wrap = app.querySelector('[data-vault-results]');
    const countNodes = app.querySelectorAll('[data-vault-count]');
    if (!wrap) return;
    const items = filterItems();
    if (state.selected && !items.some(i=>i.id === state.selected)) {
      state.selected = '';
    }
    countNodes.forEach(node => node.textContent = `${items.length} items`);
    wrap.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'vault-empty';
      empty.innerHTML = `<div class=\"h3\">No results</div><div class=\"muted\">Try clearing filters or searching a different term.</div>`;
      wrap.appendChild(empty);
      return;
    }
    for (const item of items) {
      const cat = categoryMap.get(item.category);
      let domain = '';
      try { domain = new URL(item.url).hostname.replace(/^www\./, ''); } catch {}
      const card = document.createElement('article');
      card.className = 'vault-item';
      card.dataset.itemId = item.id;
      if (state.selected === item.id) card.dataset.selected = 'true';
      card.innerHTML = `
        <div class="meta">${cat ? cat.label : item.category}</div>
        <div class="title-row">
          <img class="logo" src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" alt=""/>
          <div class="title">${item.title}</div>
        </div>
        <div class="muted">${item.note || ''}</div>
        <div class="tag-row">
          ${(item.tags || []).slice(0, 6).map(t=>`<span class=\"pill\">${t}</span>`).join('')}
        </div>
        <div class="actions">
          <a class="btn" href="${item.url}" target="_blank" rel="noreferrer">Open</a>
          <a class="btn ghost" href="/go/?id=${item.id}">Redirect</a>
          <button class="btn ghost" type="button" data-detail="${item.id}">Details</button>
        </div>
      `;
      card.addEventListener('click', (e)=>{
        const target = e.target;
        if (!target) return;
        const tag = target.tagName ? target.tagName.toLowerCase() : '';
        if (tag === 'a' || tag === 'button') return;
        state.selected = item.id;
        renderDetail();
        wrap.querySelectorAll('[data-selected]').forEach(el=>el.removeAttribute('data-selected'));
        card.dataset.selected = 'true';
        if (window.matchMedia('(max-width: 1100px)').matches) {
          const pane = app.querySelector('[data-vault-detail]');
          if (pane) pane.scrollIntoView({behavior:'smooth', block:'start'});
        }
      });
      wrap.appendChild(card);
    }
    wrap.querySelectorAll('[data-detail]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        state.selected = btn.dataset.detail;
        renderDetail();
        location.hash = `item/${state.selected}`;
        if (window.matchMedia('(max-width: 1100px)').matches) {
          const pane = app.querySelector('[data-vault-detail]');
          if (pane) pane.scrollIntoView({behavior:'smooth', block:'start'});
        }
      });
    });
  }

  function renderDetail(){
    const pane = app.querySelector('[data-vault-detail]');
    if (!pane) return;
    const item = byId.get(state.selected);
    if (!item) {
      pane.innerHTML = '<div class="muted">Select an item for details.</div>';
      return;
    }
    const cat = categoryMap.get(item.category);
    let domain = '';
    try { domain = new URL(item.url).hostname.replace(/^www\./, ''); } catch {}
    pane.innerHTML = `
      <div class="badge">${cat ? cat.label : item.category}</div>
      <h3>${item.title}</h3>
      <div class="muted">${item.note || ''}</div>
      <div class="muted" style="margin-top:8px">${domain}</div>
      <div class="linklist" style="margin-top:12px">
        ${(item.tags || []).map(t=>`<span class="pill">${t}</span>`).join('')}
      </div>
      <div class="btnrow" style="margin-top:12px">
        <a class="btn primary" href="${item.url}" target="_blank" rel="noreferrer">Open Site</a>
        <a class="btn" href="/go/?id=${item.id}">Redirect</a>
      </div>
    `;
  }

  function render(){
    renderCounts();
    renderMeta();
    renderFilters();
    renderCollections();
    renderResults();
    renderDetail();
  }

  const viewKey = 'vaultView';
  const viewButtons = app.querySelectorAll('[data-vault-view]');
  const resultsWrap = app.querySelector('[data-vault-results]');
  function applyView(mode){
    if (!resultsWrap) return;
    resultsWrap.dataset.view = mode;
    viewButtons.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-vault-view') === mode));
  }
  const savedView = localStorage.getItem(viewKey) || 'rail';
  applyView(savedView);
  viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-vault-view') || 'grid';
      localStorage.setItem(viewKey, mode);
      applyView(mode);
    });
  });

  render();
})();
