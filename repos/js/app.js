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

  if (fileName && (!isFileAllowed(fileName) || isFileExcluded(fileName))) {
    let reason = '';
    if (!isFileAllowed(fileName) && CONFIG.allowedExtensions.length > 0) {
      reason = `Only ${CONFIG.allowedExtensions.join(', ')} files can be viewed.`;
    }
    if (isFileExcluded(fileName)) {
      reason = `File type ${fileName.substring(fileName.lastIndexOf('.')).toLowerCase()} is excluded.`;
    }
    contentEl.innerHTML = `<p style="color:#aaffaa;text-align:center;padding:30px 0;">
      ${reason}<br>
      <a href="./?${encodeURIComponent(repoName)}">← Show README</a></p>`;
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
      const existingDesc = header.querySelector('.repo-desc');
      if (existingDesc) existingDesc.remove();
      const d = document.createElement('p');
      d.className = 'repo-desc';
      d.style.cssText = 'font-size:13px;margin:6px 0;';
      d.textContent = repo.description;
      header.appendChild(d);
    }

    // releases
    try {
      const releases = await cachedApiGet(`/repos/${USER}/${encodeURIComponent(repoName)}/releases?per_page=5`);
      if (releases && releases.length > 0) {
        releaseSection.classList.remove('hidden');
        const releasesHref = './?' + encodeURIComponent(repoName) + (currentFile ? '/' + encodeURIComponent(currentFile) : '') + '#releases';
        const releasesBtn = document.createElement('a');
        releasesBtn.href = releasesHref;
        releasesBtn.className = 'btn btn-secondary';
        releasesBtn.textContent = '📦 Releases';
        releasesBtn.onclick = (e) => {
          e.preventDefault();
          const section = document.getElementById('releases');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
          history.replaceState(null, '', releasesHref);
        };
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

    // scroll para releases se a hash for #releases
    if (window.location.hash === '#releases') {
      const relSection = document.getElementById('releases');
      if (relSection) {
        setTimeout(() => relSection.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
    let content = null;
    let actualFile = fileName;

    if (!actualFile) {
      const readmeCandidates = CONFIG.allowedExtensions.length > 0 ? CONFIG.allowedExtensions : ['.md', '.txt', '.markdown'];
      for (const ext of readmeCandidates) {
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
      const ext = dot !== -1 ? actualFile.substring(dot).toLowerCase() : '';
      const isMd = ext === '.md';

      if (isMd) {
        contentEl.innerHTML = marked.parse(content, {
          renderer: createRenderer(repoName, currentBranch, actualFile)
        });
      } else {
        const lang = getLangForExtension(actualFile);
        contentEl.innerHTML = `<pre><code class="language-${lang}">${escapeHtml(content)}</code></pre>`;
      }
      try {
        contentEl.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
      } catch (_) {}

      // ── CSS para heading-anchor e copy-btn ──
      if (!document.getElementById('repo-ui-style')) {
        const style = document.createElement('style');
        style.id = 'repo-ui-style';
        style.textContent = `
          .heading-anchor { text-decoration:none; color:#888; opacity:0; transition:opacity .1s; margin-right:4px; }
          h1:hover .heading-anchor, h2:hover .heading-anchor, h3:hover .heading-anchor,
          h4:hover .heading-anchor, h5:hover .heading-anchor, h6:hover .heading-anchor { opacity:1; }
          .code-block { position:relative; }
          .copy-btn {
            position:absolute; top:4px; right:4px; z-index:10;
            background:#222; color:#0f0; border:1px solid #555;
            border-radius:4px; cursor:pointer; font-size:12px; padding:2px 6px;
            line-height:1; opacity:0; transition:opacity .15s;
          }
          pre:hover .copy-btn,
          .code-block:hover .copy-btn { opacity:1; }
        `;
        document.head.appendChild(style);
      }

      // ── botão copiar nos blocos de código ──
      contentEl.querySelectorAll('pre').forEach(pre => {
        if (pre.parentElement?.classList.contains('code-block')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block';
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = '📋';
        btn.onclick = async () => {
          try {
            await navigator.clipboard.writeText(pre.querySelector('code')?.textContent || pre.textContent);
            btn.textContent = '✓';
            setTimeout(() => { btn.textContent = '📋'; }, 2000);
          } catch (_) {
            btn.textContent = '✗';
            setTimeout(() => { btn.textContent = '📋'; }, 2000);
          }
        };
        pre.parentElement.insertBefore(wrapper, pre);
        wrapper.appendChild(btn);
        wrapper.appendChild(pre);
      });
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