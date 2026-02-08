(function(){
  const fileInput = document.getElementById('file-input');
  const rawInput = document.getElementById('raw-input');
  const parseBtn = document.getElementById('parse-btn');
  const clearBtn = document.getElementById('clear-btn');
  const downloadBtn = document.getElementById('download-btn');
  const preview = document.getElementById('preview');
  const summary = document.getElementById('summary');

  let parsed = [];

  function parseCSV(text){
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter).map(h=>h.trim());
    const rows = [];
    for (let i=1;i<lines.length;i++) {
      const cols = lines[i].split(delimiter).map(c=>c.trim());
      const row = {};
      headers.forEach((h, idx)=>{row[h]=cols[idx] || ''});
      if (row.tags) row.tags = row.tags.split(/\||;/).map(t=>t.trim()).filter(Boolean);
      rows.push(row);
    }
    return rows;
  }

  function parseJSON(text){
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) return data;
    } catch {}
    return [];
  }

  function normalize(items){
    return items.map(item=>({
      id: String(item.id || '').trim(),
      title: String(item.title || '').trim(),
      url: String(item.url || '').trim(),
      category: String(item.category || '').trim(),
      tags: Array.isArray(item.tags) ? item.tags : String(item.tags || '').split(/\||;/).map(t=>t.trim()).filter(Boolean),
      note: String(item.note || '').trim()
    })).filter(i=>i.id && i.title && i.url && i.category);
  }

  function render(){
    summary.textContent = parsed.length ? `${parsed.length} items parsed` : 'No data yet.';
    preview.textContent = parsed.length ? JSON.stringify(parsed.slice(0, 12), null, 2) : '';
  }

  parseBtn.addEventListener('click', ()=>{
    const text = rawInput.value.trim();
    const data = text.startsWith('[') ? parseJSON(text) : parseCSV(text);
    parsed = normalize(data);
    render();
  });

  clearBtn.addEventListener('click', ()=>{
    rawInput.value = '';
    parsed = [];
    render();
  });

  downloadBtn.addEventListener('click', ()=>{
    if (!parsed.length) return;
    const blob = new Blob([JSON.stringify(parsed, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'catalog.import.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  fileInput.addEventListener('change', async (e)=>{
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const text = await file.text();
    rawInput.value = text;
  });

  render();
})();
