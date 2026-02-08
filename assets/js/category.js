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
      return `<a href="${go(item.url)}" data-logo="on">${item.title}</a>`;
    }).join('');
  }).catch(() => {
    target.innerHTML = '<div class="muted">Unable to load the catalog.</div>';
  });
})();
