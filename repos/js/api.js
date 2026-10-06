// ── chamada direta à API do GitHub ──
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

// ── fetch de arquivo raw ──
function rawFetch(url) {
  return fetch(url).then(r => {
    if (!r.ok) throw new Error('NOT_FOUND');
    return r.text();
  });
}

// ── cache localStorage (TTL 1h) ──
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