// ── HTML escape ──
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── query string parser ──
function getParams() {
  const qs = window.location.search.replace(/^\?/, '');
  if (!qs) return {};
  if (!qs.includes('=')) {
    const value = decodeURIComponent(qs);
    const slash = value.indexOf('/');
    if (slash === -1) return { repo: value };
    return { repo: value.substring(0, slash), file: value.substring(slash + 1) };
  }
  const p = {};
  qs.split('&').forEach(pair => {
    const kv = pair.split('=');
    const k = decodeURIComponent(kv[0]);
    const v = kv.length > 1 ? decodeURIComponent(kv.slice(1).join('=')) : '';
    p[k] = v;
  });
  return p;
}

// ── view switcher ──
function show(id) {
  ['loading', 'error', 'repo-list', 'repo-view'].forEach(k => {
    const el = document.getElementById(k);
    if (el) el.classList.add('hidden');
  });
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
  document.body.classList.add('loaded');
}

// ── error screen ──
function showError(msg) {
  const p = document.querySelector('#error p');
  if (msg) p.textContent = msg;
  show('error');
}

// ── smooth scroll to heading anchor ──
function scrollToHeading(slug, url) {
  const el = document.getElementById(slug);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  history.replaceState(null, '', url);
}

// ── allowlist / blocklist ──
function isFileAllowed(path) {
  if (!path || path === '') return false;
  if (path.includes('..')) return false;
  if (CONFIG.allowedExtensions.length > 0) {
    const dot = path.lastIndexOf('.');
    if (dot === -1) return false;
    const ext = path.substring(dot).toLowerCase();
    if (!CONFIG.allowedExtensions.includes(ext)) return false;
  }
  return true;
}

function isFileExcluded(path) {
  if (!path || CONFIG.excludeExtensions.length === 0) return false;
  const dot = path.lastIndexOf('.');
  if (dot === -1) return false;
  const ext = path.substring(dot).toLowerCase();
  return CONFIG.excludeExtensions.includes(ext);
}

function getLangForExtension(path) {
  if (!path) return '';
  const dot = path.lastIndexOf('.');
  if (dot === -1) return '';
  const ext = path.substring(dot).toLowerCase();
  return CONFIG.extensionToLang[ext] || ext.substring(1);
}

function isRepoShown(name) {
  if (CONFIG.allowedRepos.length > 0) return CONFIG.allowedRepos.includes(name);
  if (CONFIG.excludeRepos.includes(name)) return false;
  return true;
}

// ── per-repo CSS loader ──
async function loadRepoCSS(repoName) {
  const encoded = encodeURIComponent(repoName);
  const cssId = 'repo-css';
  const old = document.getElementById(cssId);
  if (old) old.remove();

  const stdResp = await fetch('css/' + encoded + '.std.css?t=' + Date.now());
  if (stdResp.ok) {
    const txt = await stdResp.text();
    if (txt.trim()) {
      ['/assets/css/global.css', 'style.css'].forEach(href => {
        const link = document.querySelector('link[href="' + href + '"]');
        if (link) link.remove();
      });
      const el = document.createElement('style');
      el.id = cssId;
      el.textContent = txt;
      document.head.appendChild(el);
      return;
    }
  }

  const ovResp = await fetch('css/' + encoded + '.css?t=' + Date.now());
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