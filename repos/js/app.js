// ── lista de repositórios ──

async function loadRepoList() {
  try {
    const repos = await cachedApiGet(`/users/${USER}/repos?per_page=100&sort=updated&type=owner`);
    const grid = document.querySelector('.repo-grid');
    const searchInput = document.getElementById('repo-search');
    const langSelect = document.getElementById('filter-lang');
    const sortSelect = document.getElementById('filter-sort');
    const countEl = document.getElementById('repo-count');
    grid.innerHTML = '';
    document.title = 'Repos — KaioHSG.Dev';

    // ── montar cards e coletar linguagens ──
    let shown = [];
    let langs = new Set();
    for (const repo of repos) {
      if (!isRepoShown(repo.name)) continue;
      const card = document.createElement('div');
      card.className = 'repo-card';
      card.dataset.name = repo.name.toLowerCase();
      card.dataset.desc = (repo.description || '').toLowerCase();
      card.dataset.lang = (repo.language || '').toLowerCase();
      card.dataset.stars = repo.stargazers_count || 0;
      card.dataset.forks = repo.forks_count || 0;
      card.dataset.updated = repo.updated_at || '';
      if (repo.language) langs.add(repo.language);

      const desc = repo.description ? escapeHtml(repo.description) : '<em>no description</em>';
      const lang = repo.language ? `<span class="repo-lang">${escapeHtml(repo.language)}</span>` : '';
      const stars = repo.stargazers_count > 0 ? `<span class="repo-stars">★ ${repo.stargazers_count}</span>` : '';
      const forks = repo.forks_count > 0 ? `<span>⑂ ${repo.forks_count}</span>` : '';
      const date = repo.updated_at ? new Date(repo.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

      card.innerHTML = `
        <div class="repo-name"><a href="./?${encodeURIComponent(repo.name)}">${escapeHtml(repo.name)}</a></div>
        <div class="repo-desc">${desc}</div>
        <div class="repo-meta">${lang} ${stars} ${forks} <span>${date}</span></div>
      `;
      card.dataset.all = card.textContent.toLowerCase();
      grid.appendChild(card);
      shown.push({ card, repo });
    }

    // ── popular select de linguagens ──
    langSelect.innerHTML = '<option value="">All languages</option>';
    [...langs].sort().forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.toLowerCase();
      opt.textContent = l;
      langSelect.appendChild(opt);
    });

    // ── aplicar filtros e ordenação ──
    function doFilter() {
      const q = searchInput.value.toLowerCase().trim();
      const langVal = langSelect.value;
      const sortVal = sortSelect.value;

      // atualizar URL sem recarregar a página
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (langVal) params.set('lang', langVal);
      if (sortVal && sortVal !== 'updated') params.set('sort', sortVal);
      const newUrl = window.location.pathname + (params.toString() ? '?' + params : '');
      history.replaceState(null, '', newUrl);

      // filtrar
      let filtered = shown.filter(({ card, repo }) => {
        if (!isRepoShown(repo.name)) return false;
        if (q && !card.dataset.all.includes(q)) return false;
        if (langVal && card.dataset.lang !== langVal) return false;
        return true;
      });

      // ordenar
      filtered.sort((a, b) => {
        if (sortVal === 'stars') return b.card.dataset.stars - a.card.dataset.stars;
        if (sortVal === 'forks') return b.card.dataset.forks - a.card.dataset.forks;
        if (sortVal === 'name') return a.card.dataset.name.localeCompare(b.card.dataset.name);
        return b.card.dataset.updated.localeCompare(a.card.dataset.updated);
      });

      // esconder todos, mostrar só filtrados na ordem correta
      for (const { card } of shown) card.style.display = 'none';
      for (const { card } of filtered) {
        card.style.display = '';
        grid.appendChild(card);
      }

      countEl.textContent = filtered.length + ' / ' + shown.length + ' repos';
      countEl.classList.remove('hidden');
    }

    // ── aplicar filtros da URL ──
    const params = getParams();
    if (params.q) searchInput.value = params.q;
    if (params.lang) { const opt = [...langSelect.options].find(o => o.value === params.lang); if (opt) langSelect.value = params.lang; }
    if (params.sort) { const opt = [...sortSelect.options].find(o => o.value === params.sort); if (opt) sortSelect.value = params.sort; }

    searchInput.oninput = doFilter;
    langSelect.onchange = doFilter;
    sortSelect.onchange = doFilter;
    doFilter();

    if (shown.length === 0) {
      grid.innerHTML = '<p style="text-align:center;">No repositories found.</p>';
      countEl.classList.add('hidden');
    }

    show('repo-list');
  } catch (e) {
    showError('Could not load repositories. Try again later.');
  }
}

// ── visualização de um repositório ──

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
    const cloneUrl = repo.clone_url || `${repoUrl}.git`;
    titleEl.innerHTML = `<a href="./?${encodeURIComponent(repoName)}" style="text-decoration:none;">${escapeHtml(repoName)}</a>`;
    actionsEl.innerHTML = `
      <a href="${repoUrl}" target="_blank" rel="noopener" class="btn btn-primary">View on GitHub</a>
      <a href="${repoUrl}/archive/refs/heads/${currentBranch}.zip" class="btn btn-secondary">⬇ Download ZIP</a>
    `;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-secondary';
    copyBtn.textContent = '📋 Clone';
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(cloneUrl);
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => { copyBtn.textContent = '📋 Clone'; }, 2000);
      } catch (_) {
        copyBtn.textContent = '✗ Error';
        setTimeout(() => { copyBtn.textContent = '📋 Clone'; }, 2000);
      }
    };
    actionsEl.appendChild(copyBtn);

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

// ── entry point ──

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