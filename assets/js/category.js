(() => {
  const target = document.querySelector('[data-category-top]');
  if (!target) return;

  const path = location.pathname.split('/').filter(Boolean);
  const openIdx = path.indexOf('open-source');
  const category = openIdx >= 0 ? path[openIdx + 1] : null;
  if (!category || category === 'vault' || category === 'import') {
    return;
  }

  const go = (url) => `/go/?url=${encodeURIComponent(url)}`;

  Promise.all([
    fetch('/data/open-source/catalog.json').then(r => r.json()),
    fetch('/data/open-source/categories.json').then(r => r.json()).catch(() => [])
  ]).then(([items, categories]) => {
    const label = categories.find(c => c.id === category)?.title || category;
    const top = items.filter(i => i.category === category).slice(0, 16);
    if (!top.length) {
      target.innerHTML = `<div class="muted">No items yet in ${label}. Add entries to the catalog to populate this hub.</div>`;
      return;
    }
    target.innerHTML = top.map(item => {
      let domain = '';
      try { domain = new URL(item.url).hostname.replace(/^www\\./, ''); } catch {}
      const logo = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : '';
      return `<a href="${go(item.url)}" data-logo="on">
        ${logo ? `<span class="mini-logo" style="background-image:url('${logo}')"></span>` : ''}
        <span>${item.title}</span>
      </a>`;
    }).join('');
  }).catch(() => {
    target.innerHTML = '<div class="muted">Unable to load the catalog.</div>';
  });
})();
