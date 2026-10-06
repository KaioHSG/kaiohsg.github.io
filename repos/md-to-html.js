const USER = 'KaioHSG';
const GITHUB_API = 'https://api.github.com';
const RAW_BASE = `https://raw.githubusercontent.com/${USER}`;

const CONFIG = {
  allowedRepos: [],
  excludeRepos: [],
  allowedExtensions: ['.md', '.txt']
};

let currentRepo = null;
let currentBranch = 'main';
let currentFile = null;

/* ── helpers ── */

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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
      if (k !== 'file' && k !== 'repo') {
        p.repo = k;
        delete p[k];
        break;
      }
    }
  }
  return p;
}

function apiGet(path) {
  return fetch(`${GITHUB_API}${path}`, {
    headers: { Accept: 'application/vnd.github.v3+json' }
  }).then(r => {
    if (r.status === 403) throw new Error('RATE_LIMITED');
    if (r.status === 404) throw new Error('NOT_FOUND');
    if (!r.ok) throw new Error('HTTP_' + r.status);
    return r.json();
  });
}

function rawFetch(url) {
  return fetch(url).then(r => {
    if (!r.ok) throw new Error('NOT_FOUND');
    return r.text();
  });
}

/* ── cache (localStorage, TTL de 1h) ── */

const CACHE_TTL = 60 * 60 * 1000;

function cacheGet(key) {
  try {
    const raw = localStorage.getItem('ghc_' + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) {
      localStorage.removeItem('ghc_' + key);
      return null;
    }
    return entry.data;
  } catch (_) { return null; }
}

function cacheSet(key, data) {
  try {
    localStorage.setItem('ghc_' + key, JSON.stringify({ ts: Date.now(), data }));
  } catch (_) {}
}

async function cachedApiGet(path) {
  const cached = cacheGet(path);
  if (cached) return cached;
  const data = await apiGet(path);
  cacheSet(path, data);
  return data;
}

/* ── per-repo CSS loader (blocking — evita flash do tema retrô) ── */

async function loadRepoCSS(repoName) {
  const cssId = 'repo-css';
  const old = document.getElementById(cssId);
  if (old) old.remove();
  const repoFile = `${encodeURIComponent(repoName)}.css`;
  try {
    const repoResp = await fetch(`css/${repoFile}?t=${Date.now()}`);
    if (!repoResp.ok) return;
    const repoTxt = await repoResp.text();
    if (!repoTxt.trim()) return;
    const sheets = [
      { file: 'reset.css', id: cssId + '-reset' },
      { file: repoFile, id: cssId }
    ];
    for (const sht of sheets) {
      const r = await fetch(`css/${sht.file}?t=${Date.now()}`);
      if (r.ok) {
        const t = await r.text();
        if (t.trim()) {
          const el = document.createElement('style');
          el.id = sht.id;
          el.textContent = t;
          document.head.appendChild(el);
        }
      }
    }
  } catch (_) {}
}

function show(id) {
  ['loading', 'error', 'repo-list', 'repo-view'].forEach(k => {
    const el = document.getElementById(k);
    if (el) el.classList.add('hidden');
  });
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
  document.body.style.opacity = '1';
}

/* ── whitelist validation ── */

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

/* ── markdown renderer ── */

function createRenderer(repo, branch, file) {
  const base = `${RAW_BASE}/${repo}/${branch}/`;
  const dir = file && file.includes('/') ? file.substring(0, file.lastIndexOf('/') + 1) : '';

  return {
    heading(text, level) {
      const slug = text.toLowerCase()
        .replace(/<[^>]*>/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      return `<h${level} id="${slug}">${text}</h${level}>`;
    },
    link(href, title, text) {
      if (!href) return text;
      if (href.startsWith('http')) {
        return `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
      }
      if (/\.(md|txt)(#|$)/i.test(href)) {
        const [filePath, anchor] = href.split('#');
        let resolved = filePath;
        if (resolved.startsWith('/')) {
          resolved = resolved.substring(1);
        } else {
          resolved = resolved.replace(/^\.\//, '');
          resolved = dir + resolved;
        }
        if (!isFileAllowed(resolved)) {
          return `<a href="${href}">${text}</a>`;
        }
        const a = anchor ? '#' + anchor : '';
        return `<a href="./?repo=${encodeURIComponent(repo)}&file=${encodeURIComponent(resolved)}${a}">${text}</a>`;
      }
      return `<a href="${href}">${text}</a>`;
    },
image(href, title, text) {
      if (!href) return '';
      let src = href.startsWith('http') ? href : base + href.replace(/^\.\//, '');
      if (src.includes('shields.io')) {
        const root = getComputedStyle(document.documentElement);
        let s = root.getPropertyValue('--shields-style').trim();
        let c = root.getPropertyValue('--shields-color').trim();
        if (!s || s === 'none' || s === 'null') s = '';
        if (!c || c === 'none' || c === 'null') c = '';
        const params = [];
        if (s) params.push('style=' + s);
        if (c) params.push('color=' + c);
        if (params.length) {
          const sep = src.includes('?') ? '&' : '?';
          src += sep + params.join('&');
        }
      }
      return `<img src="${src}" alt="${escapeHtml(text)}">`;
    },
    br() { return '<br>\n'; },
    paragraph(text) { return `<p>${text}</p>\n`; },
    list(text, ordered) {
      const tag = ordered ? 'ol' : 'ul';
      return `<${tag}>\n${text}</${tag}>\n`;
    },
    listitem(text) { return `<li>${text}</li>\n`; },
    codespan(text) { return `<code>${text}</code>`; },
    del(text) { return `<del>${text}</del>`; },
    html(text) { return text; },
    code(text, lang) {
      const cls = lang ? ` class="language-${lang}"` : '';
      return `<pre><code${cls}>${escapeHtml(text)}</code></pre>\n`;
    },
    strong(text) { return `<strong>${text}</strong>`; },
    em(text) { return `<em>${text}</em>`; },
    hr() { return '<hr>\n'; },
    blockquote(text) { return `<blockquote>${text}</blockquote>\n`; },
    table(header, body) {
      if (body) return `<table>\n<thead>\n${header}</thead>\n<tbody>\n${body}</tbody>\n</table>\n`;
      return `<table>\n${header}\n</table>\n`;
    },
    tablerow(text) { return `<tr>${text}</tr>\n`; },
    tablecell(text, flags) {
      const tag = flags.header ? 'th' : 'td';
      const align = flags.align ? ` align="${flags.align}"` : '';
      return `<${tag}${align}>${text}</${tag}>\n`;
    },
    text(text) { return text; }
  };
}

/* ── error ── */

function showError(msg) {
  const p = document.querySelector('#error p');
  if (msg) p.textContent = msg;
  show('error');
}

/* ── repo list ── */

async function loadRepoList() {
  try {
    const repos = await cachedApiGet(`/users/${USER}/repos?per_page=100&sort=updated&type=owner`);
    const grid = document.querySelector('.repo-grid');
    grid.innerHTML = '';
    document.title = 'Repos — KaioHSG.Dev';

    let count = 0;
    for (const repo of repos) {
      if (!isRepoShown(repo.name)) continue;
      count++;

      const card = document.createElement('div');
      card.className = 'repo-card';
      const desc = repo.description ? escapeHtml(repo.description) : '<em>no description</em>';
      const lang = repo.language ? `<span class="repo-lang">${escapeHtml(repo.language)}</span>` : '';
      const stars = repo.stargazers_count > 0 ? `<span class="repo-stars">★ ${repo.stargazers_count}</span>` : '';
      const forks = repo.forks_count > 0 ? `<span>⑂ ${repo.forks_count}</span>` : '';
      const date = repo.updated_at ? new Date(repo.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
      const vis = repo.private ? '🔒 private' : '📂 public';

      card.innerHTML = `
        <div class="repo-name"><a href="./?${encodeURIComponent(repo.name)}">${escapeHtml(repo.name)}</a></div>
        <div class="repo-desc">${desc}</div>
        <div class="repo-meta">${vis} ${lang} ${stars} ${forks} <span>${date}</span></div>
      `;
      grid.appendChild(card);
    }

    if (count === 0) {
      grid.innerHTML = '<p style="text-align:center;color:#aaffaa;">No repositories found.</p>';
    }

    show('repo-list');
  } catch (e) {
    showError('Could not load repositories. Try again later.');
  }
}

/* ── single repo view ── */

async function loadRepoView(repoName, fileName) {
  currentRepo = repoName;
  currentFile = fileName;

  const header = document.querySelector('.repo-header');
  const titleEl = header.querySelector('.repo-title');
  const actionsEl = header.querySelector('.repo-actions');
  const releaseSection = document.querySelector('.release-section');
  const releaseList = document.querySelector('.release-list');
  const contentEl = document.getElementById('markdown-content');

  titleEl.textContent = repoName;
  actionsEl.innerHTML = '';
  releaseList.innerHTML = '';
  contentEl.innerHTML = '';
  releaseSection.classList.add('hidden');

  if (fileName && !isFileAllowed(fileName)) {
    contentEl.innerHTML = `<p style="color:#aaffaa;text-align:center;padding:30px 0;">
      File type not allowed. Only ${CONFIG.allowedExtensions.join(', ')} README files can be viewed.<br>
      <a href="./?repo=${encodeURIComponent(repoName)}">← Show README</a></p>`;
    titleEl.textContent = repoName + ' — blocked';
    show('repo-view');
    return;
  }

  try {
    const repo = await cachedApiGet(`/repos/${USER}/${encodeURIComponent(repoName)}`);
    currentBranch = repo.default_branch || 'main';
    document.title = `${repoName} — KaioHSG.Dev`;

    await loadRepoCSS(repoName);

    const repoUrl = repo.html_url || `https://github.com/${USER}/${repoName}`;
    titleEl.innerHTML = `<a href="./?${encodeURIComponent(repoName)}" style="text-decoration:none;">${escapeHtml(repoName)}</a>`;
    actionsEl.innerHTML = `
      <a href="${repoUrl}" target="_blank" rel="noopener" class="btn btn-primary">View on GitHub</a>
      <a href="${repoUrl}/archive/refs/heads/${currentBranch}.zip" class="btn btn-secondary">Download ZIP</a>
    `;

    if (repo.description) {
      const d = document.createElement('p');
      d.style.cssText = 'font-size:13px;margin:6px 0;';
      d.textContent = repo.description;
      header.appendChild(d);
    }

    // releases
    try {
      const releases = await cachedApiGet(`/repos/${USER}/${encodeURIComponent(repoName)}/releases?per_page=5`);
      if (releases && releases.length > 0) {
        releaseSection.classList.remove('hidden');
        const releasesBtn = document.createElement('a');
        releasesBtn.href = `${repoUrl}/releases`;
        releasesBtn.target = '_blank';
        releasesBtn.rel = 'noopener';
        releasesBtn.className = 'btn btn-secondary';
        releasesBtn.textContent = '📦 Releases';
        actionsEl.appendChild(releasesBtn);

        for (const rel of releases) {
          const item = document.createElement('div');
          item.className = 'release-item';

          let assetsHtml = '';
          if (rel.assets && rel.assets.length > 0) {
            assetsHtml = '<div class="release-assets">' +
              rel.assets.map(a =>
                `<a href="${a.browser_download_url}" class="release-asset-link" download>${escapeHtml(a.name)}</a>`
              ).join('') +
              '</div>';
          }

          const tag = rel.tag_name ? `<span class="release-tag">${escapeHtml(rel.tag_name)}</span>` : '';
          const date = rel.published_at
            ? new Date(rel.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : '';
          item.innerHTML = `${tag} <span class="release-name">${escapeHtml(rel.name || rel.tag_name || '(untagged)')}</span> <span class="release-date">${date}</span> ${assetsHtml}`;
          releaseList.appendChild(item);
        }
      }
    } catch (_) {}

    // fetch file
    let content = null;
    let actualFile = fileName;

    if (!actualFile) {
      for (const ext of CONFIG.allowedExtensions) {
        const candidate = 'README' + ext;
        try {
          content = await rawFetch(`${RAW_BASE}/${encodeURIComponent(repoName)}/${currentBranch}/${candidate}`);
          actualFile = candidate;
          break;
        } catch (_) {}
      }
    } else {
      try {
        content = await rawFetch(`${RAW_BASE}/${encodeURIComponent(repoName)}/${currentBranch}/${actualFile.replace(/\\/g, '/').split('/').map(s => encodeURIComponent(s)).join('/')}`);
      } catch (_) {
        content = null;
      }
    }

    if (content) {
      const dot = actualFile.lastIndexOf('.');
      const isTxt = dot !== -1 && actualFile.substring(dot).toLowerCase() === '.txt';
      if (isTxt) {
        contentEl.innerHTML = `<pre class="raw-txt">${escapeHtml(content)}</pre>`;
      } else {
        contentEl.innerHTML = marked.parse(content, {
          renderer: createRenderer(repoName, currentBranch, actualFile)
        });
        try {
          contentEl.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
        } catch (_) {}
      }
    } else {
      const displayName = fileName || 'README';
      contentEl.innerHTML = `<p style="color:#aaffaa;font-style:italic;text-align:center;padding:30px 0;">
        File not found in this repository.<br>
        <a href="${repoUrl}" target="_blank" rel="noopener" style="color:#ffcc00;">Open on GitHub →</a></p>`;
    }

    show('repo-view');
  } catch (e) {
    if (e.message === 'RATE_LIMITED') showError('GitHub API rate limit exceeded. Please try again later.');
    else if (e.message === 'NOT_FOUND') showError(`Repository "${escapeHtml(repoName)}" not found.`);
    else showError(`Error loading "${escapeHtml(repoName)}": ${e.message || 'unknown'}`);
  }
}

/* ── entry ── */

async function loadContent() {
  const params = getParams();
  if (params.repo) {
    await loadRepoView(params.repo, params.file);
  } else {
    await loadRepoList();
  }
}

loadContent();
window.addEventListener('popstate', loadContent);