// ── escape HTML ──
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── parser de query string ──
function getParams() {
  const qs = window.location.search.replace(/^\?/, '');
  if (!qs) return {};
  if (!qs.includes('=')) {
    return { repo: decodeURIComponent(qs) };
  }
  const p = {};
  qs.split('&').forEach(pair => {
    const kv = pair.split('=');
    const k = decodeURIComponent(kv[0]);
    const v = kv.length > 1 ? decodeURIComponent(kv.slice(1).join('=')) : '';
    p[k] = v;
  });
  if (!p.repo) {
    for (const k in p) {
      if (!['file', 'repo', 'q', 'lang', 'sort'].includes(k)) {
        p.repo = k;
        delete p[k];
        break;
      }
    }
  }
  return p;
}

// ── troca de view ──
function show(id) {
  ['loading', 'error', 'repo-list', 'repo-view'].forEach(k => {
    const el = document.getElementById(k);
    if (el) el.classList.add('hidden');
  });
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
  document.body.style.opacity = '1';
}

// ── tela de erro ──
function showError(msg) {
  const p = document.querySelector('#error p');
  if (msg) p.textContent = msg;
  show('error');
}

// ── whitelist ──
function isFileAllowed(path) {
  if (!path || path === '') return false;
  if (path.includes('..')) return false;
  const dot = path.lastIndexOf('.');
  if (dot === -1) return false;
  const ext = path.substring(dot).toLowerCase();
  return CONFIG.allowedExtensions.includes(ext);
}

function isRepoShown(name) {
  if (CONFIG.allowedRepos.length > 0) return CONFIG.allowedRepos.includes(name);
  if (CONFIG.excludeRepos.includes(name)) return false;
  return true;
}

// ── carregador de CSS por repo ──
async function loadRepoCSS(repoName) {
  const encoded = encodeURIComponent(repoName);
  const cssId = 'repo-css';
  const old = document.getElementById(cssId);
  if (old) old.remove();

  const stdResp = await fetch(`css/${encoded}.std.css?t=${Date.now()}`);
  if (stdResp.ok) {
    const txt = await stdResp.text();
    if (txt.trim()) {
      ['/assets/css/global.css', 'style.css'].forEach(href => {
        const link = document.querySelector(`link[href="${href}"]`);
        if (link) link.remove();
      });
      const el = document.createElement('style');
      el.id = cssId;
      el.textContent = txt;
      document.head.appendChild(el);
      return;
    }
  }

  const ovResp = await fetch(`css/${encoded}.css?t=${Date.now()}`);
  if (ovResp.ok) {
    const txt = await ovResp.text();
    if (txt.trim()) {
      const el = document.createElement('style');
      el.id = cssId;
      el.textContent = txt;
      document.head.appendChild(el);
    }
  }
}