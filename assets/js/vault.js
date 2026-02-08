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

  const tags = Array.from(new Set(catalog.flatMap(i=>i.tags || []))).sort();

  const categoryMap = new Map(categories.map(c=>[c.id, c]));
  const collectionMap = new Map(collections.map(c=>[c.id, c]));

  const byId = new Map(catalog.map(i=>[i.id, i]));

  const searchInput = app.querySelector('[data-vault-search]');
  if (searchInput) {
    searchInput.addEventListener('input', (e)=>{
      state.query = e.target.value.trim().toLowerCase();
      render();
    });
  }

  function renderFilters(){
    const catWrap = app.querySelector('[data-vault-categories]');
    const tagWrap = app.querySelector('[data-vault-tags]');
    if (catWrap) {
      catWrap.innerHTML = '';
      const all = document.createElement('button');
      all.className = 'filter-chip' + (!state.category ? ' active' : '');
      all.textContent = 'All';
      all.addEventListener('click', ()=>{state.category='';state.collection='';render();});
      catWrap.appendChild(all);
      for (const cat of categories) {
        const btn = document.createElement('button');
        btn.className = 'filter-chip' + (state.category === cat.id ? ' active' : '');
        btn.textContent = cat.label;
        btn.addEventListener('click', ()=>{state.category = cat.id; state.collection=''; render();});
        catWrap.appendChild(btn);
      }
    }
    if (tagWrap) {
      tagWrap.innerHTML = '';
      for (const tag of tags.slice(0, 24)) {
        const btn = document.createElement('button');
        btn.className = 'filter-chip' + (state.tag === tag ? ' active' : '');
        btn.textContent = tag;
        btn.addEventListener('click', ()=>{state.tag = state.tag === tag ? '' : tag; render();});
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
      card.innerHTML = `<h4>${col.title}</h4><div class="muted">${col.summary}</div>`;
      card.addEventListener('click', ()=>{state.collection = col.id; state.category=''; render(); location.hash = `collection/${col.id}`;});
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
      a.href = `/open-source/vault/#category/${cat.id}`;
      a.textContent = `${cat.label} (${count})`;
      wrap.appendChild(a);
    }
  }

  function renderResults(){
    const wrap = app.querySelector('[data-vault-results]');
    const count = app.querySelector('[data-vault-count]');
    if (!wrap) return;
    const items = filterItems();
    if (count) count.textContent = `${items.length} items`;
    wrap.innerHTML = '';
    for (const item of items) {
      const cat = categoryMap.get(item.category);
      let domain = '';
      try { domain = new URL(item.url).hostname.replace(/^www\./, ''); } catch {}
      const card = document.createElement('article');
      card.className = 'vault-item';
      card.innerHTML = `
        <div class="meta">${cat ? cat.label : item.category}</div>
        <div class="title-row">
          <img class="logo" src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" alt=""/>
          <div class="title">${item.title}</div>
        </div>
        <div class="muted">${item.note || ''}</div>
        <div class="actions">
          <a class="btn" href="${item.url}" target="_blank" rel="noreferrer">Open</a>
          <a class="btn ghost" href="/go/?id=${item.id}">Redirect</a>
          <button class="btn ghost" type="button" data-detail="${item.id}">Details</button>
        </div>
      `;
      wrap.appendChild(card);
    }
    wrap.querySelectorAll('[data-detail]').forEach(btn=>{
      btn.addEventListener('click', ()=>{state.selected = btn.dataset.detail; renderDetail(); location.hash = `item/${state.selected}`;});
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
    pane.innerHTML = `
      <div class="badge">${cat ? cat.label : item.category}</div>
      <h3>${item.title}</h3>
      <div class="muted">${item.note || ''}</div>
      <div class="linklist" style="margin-top:12px">
        ${(item.tags || []).map(t=>`<span class="pill">${t}</span>`).join('')}
      </div>
      <div class="btnrow" style="margin-top:12px">
        <a class="btn primary" href="${item.url}" target="_blank" rel="noreferrer">Open Site</a>
        <a class="btn" href="/go/?id=${item.id}">Safe Redirect</a>
      </div>
    `;
  }

  function render(){
    renderCounts();
    renderFilters();
    renderCollections();
    renderResults();
    renderDetail();
  }

  render();
})();
