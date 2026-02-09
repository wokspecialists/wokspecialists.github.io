(function(){
  const apiBaseEl = document.getElementById('api-base');
  const reqName = document.getElementById('req-name');
  const reqContact = document.getElementById('req-contact');
  const reqReason = document.getElementById('req-reason');
  const reqSubmit = document.getElementById('req-submit');
  const reqStatus = document.getElementById('req-status');
  const tokenInput = document.getElementById('token-input');
  const tokenVerify = document.getElementById('token-verify');
  const tokenClear = document.getElementById('token-clear');
  const tokenStatus = document.getElementById('token-status');

  const fileInput = document.getElementById('file-input');
  const rawInput = document.getElementById('raw-input');
  const parseBtn = document.getElementById('parse-btn');
  const clearBtn = document.getElementById('clear-btn');
  const downloadBtn = document.getElementById('download-btn');
  const manualOutput = document.getElementById('manual');
  const summary = document.getElementById('summary');

  const apiBase = localStorage.getItem('importApi') || document.body.dataset.importApi || 'http://localhost:8787';
  if (apiBaseEl) apiBaseEl.textContent = apiBase;

  function setLocked(locked){
    [fileInput, rawInput, parseBtn, clearBtn, downloadBtn].forEach(el=>{
      if (!el) return;
      el.disabled = locked;
      el.setAttribute('aria-disabled', locked ? 'true' : 'false');
      el.classList.toggle('is-locked', locked);
    });
  }

  let parsed = [];
  let unlocked = false;

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
    if (manualOutput) {
      manualOutput.textContent = parsed.length ? JSON.stringify(parsed.slice(0, 12), null, 2) : '';
    }
  }

  parseBtn.addEventListener('click', ()=>{
    if (!unlocked) return;
    const text = rawInput.value.trim();
    const data = text.startsWith('[') ? parseJSON(text) : parseCSV(text);
    parsed = normalize(data);
    render();
  });

  clearBtn.addEventListener('click', ()=>{
    if (!unlocked) return;
    rawInput.value = '';
    parsed = [];
    render();
  });

  downloadBtn.addEventListener('click', ()=>{
    if (!unlocked) return;
    if (!parsed.length) return;
    const blob = new Blob([JSON.stringify(parsed, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'catalog.import.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  fileInput.addEventListener('change', async (e)=>{
    if (!unlocked) return;
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const text = await file.text();
    rawInput.value = text;
  });

  async function validateToken(token){
    if (!token) {
      tokenStatus.textContent = 'Token required.';
      return false;
    }
    try {
      const res = await fetch(`${apiBase}/api/import/validate?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.valid) {
        tokenStatus.textContent = `Approved. Expires at ${new Date(data.expiresAt).toLocaleString()}.`;
        return true;
      }
      tokenStatus.textContent = 'Invalid or expired token.';
    } catch (err) {
      tokenStatus.textContent = 'Importer gate is offline.';
    }
    return false;
  }

  if (tokenVerify) {
    tokenVerify.addEventListener('click', async ()=>{
      const token = tokenInput.value.trim();
      const ok = await validateToken(token);
      if (ok) {
        localStorage.setItem('importToken', token);
        unlocked = true;
        setLocked(false);
      } else {
        unlocked = false;
        setLocked(true);
      }
    });
  }

  if (tokenClear) {
    tokenClear.addEventListener('click', ()=>{
      tokenInput.value = '';
      tokenStatus.textContent = '';
      localStorage.removeItem('importToken');
      unlocked = false;
      setLocked(true);
    });
  }

  if (reqSubmit) {
    reqSubmit.addEventListener('click', async ()=>{
      const name = reqName.value.trim();
      const reason = reqReason.value.trim();
      const contact = reqContact.value.trim();
      if (!name || !reason) {
        reqStatus.textContent = 'Name and reason are required.';
        return;
      }
      reqStatus.textContent = 'Submitting request...';
      try {
        const res = await fetch(`${apiBase}/api/request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, reason, contact })
        });
        const data = await res.json();
        if (data.ok) {
          reqStatus.textContent = `Request submitted. ID: ${data.id}`;
        } else {
          reqStatus.textContent = data.error || 'Request failed.';
        }
      } catch {
        reqStatus.textContent = 'Importer gate is offline.';
      }
    });
  }

  async function init(){
    setLocked(true);
    const stored = localStorage.getItem('importToken');
    if (stored) {
      tokenInput.value = stored;
      const ok = await validateToken(stored);
      if (ok) {
        unlocked = true;
        setLocked(false);
      }
    }
  }

  init();
  render();
})();
