// ── repo list ──

async function loadRepoList() {
  try {
    const repos = await cachedApiGet('/users/' + USER + '/repos?per_page=100&sort=updated&type=owner');
    const grid = document.querySelector('.repo-grid');
    const searchInput = document.getElementById('repo-search');
    const langSelect = document.getElementById('filter-lang');
    const sortSelect = document.getElementById('filter-sort');
    const countEl = document.getElementById('repo-count');
    grid.innerHTML = '';
    document.title = UI.repos.pageTitle;

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

      const desc = repo.description ? escapeHtml(repo.description) : UI.repos.noDescription;
      const lang = repo.language ? span('repo-lang', escapeHtml(repo.language)) : '';
      const stars = repo.stargazers_count > 0 ? span('repo-stars', '\u2605 ' + repo.stargazers_count) : '';
      const forks = repo.forks_count > 0 ? span('', '\u2382 ' + repo.forks_count) : '';
      const date = repo.updated_at
        ? new Date(repo.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '';

      card.innerHTML = div('repo-name', anchor('./?' + encodeURIComponent(repo.name), '', escapeHtml(repo.name)))
        + div('repo-desc', desc)
        + div('repo-meta', lang, ' ', stars, ' ', forks, ' ', span('', date));
      card.dataset.all = card.textContent.toLowerCase();
      grid.appendChild(card);
      shown.push({ card, repo });
    }

    langSelect.innerHTML = '<option value="">' + UI.repos.allLanguages + '</option>';
    [...langs].sort().forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.toLowerCase();
      opt.textContent = l;
      langSelect.appendChild(opt);
    });

    function doFilter() {
      const q = searchInput.value.toLowerCase().trim();
      const langVal = langSelect.value;
      const sortVal = sortSelect.value;

      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (langVal) params.set('lang', langVal);
      if (sortVal && sortVal !== 'updated') params.set('sort', sortVal);
      const newUrl = window.location.pathname + (params.toString() ? '?' + params : '');
      history.replaceState(null, '', newUrl);

      let filtered = shown.filter(({ card, repo }) => {
        if (!isRepoShown(repo.name)) return false;
        if (q && !card.dataset.all.includes(q)) return false;
        if (langVal && card.dataset.lang !== langVal) return false;
        return true;
      });

      filtered.sort((a, b) => {
        if (sortVal === 'stars') return b.card.dataset.stars - a.card.dataset.stars;
        if (sortVal === 'forks') return b.card.dataset.forks - a.card.dataset.forks;
        if (sortVal === 'name') return a.card.dataset.name.localeCompare(b.card.dataset.name);
        return b.card.dataset.updated.localeCompare(a.card.dataset.updated);
      });

      for (const { card } of shown) card.classList.add('filtered-out');
      for (const { card } of filtered) {
        card.classList.remove('filtered-out');
        grid.appendChild(card);
      }

      countEl.textContent = UI.repos.repoCount(filtered.length, shown.length);
      countEl.classList.remove('hidden');
    }

    const params = getParams();
    if (params.q) searchInput.value = params.q;
    if (params.lang) { const opt = [...langSelect.options].find(o => o.value === params.lang); if (opt) langSelect.value = params.lang; }
    if (params.sort) { const opt = [...sortSelect.options].find(o => o.value === params.sort); if (opt) sortSelect.value = params.sort; }

    searchInput.oninput = doFilter;
    langSelect.onchange = doFilter;
    sortSelect.onchange = doFilter;
    doFilter();

    if (shown.length === 0) {
      grid.innerHTML = p('empty-state', UI.repos.noReposFound);
      countEl.classList.add('hidden');
    }

    show('repo-list');
  } catch (e) {
    showError(UI.repos.errorLoad);
  }
}

// ── repo view ──

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
      reason = UI.repos.blockedAllowed(CONFIG.allowedExtensions);
    }
    if (isFileExcluded(fileName)) {
      reason = UI.repos.blockedExcluded(fileName.substring(fileName.lastIndexOf('.')).toLowerCase());
    }
    contentEl.innerHTML = p('blocked-message', reason, h('br'), anchor('./?' + encodeURIComponent(repoName), '', UI.repos.showReadme));
    titleEl.textContent = UI.repos.blockedTitle(repoName);
    show('repo-view');
    return;
  }

  try {
    const repo = await cachedApiGet('/repos/' + USER + '/' + encodeURIComponent(repoName));
    currentBranch = repo.default_branch || 'main';
    document.title = repoName + ' \u2014 ' + UI.repos.siteName;

    await loadRepoCSS(repoName);

    const repoUrl = repo.html_url || 'https://github.com/' + USER + '/' + repoName;
    const cloneUrl = repo.clone_url || repoUrl + '.git';
    titleEl.innerHTML = anchor('./?' + encodeURIComponent(repoName), 'repo-title-link', escapeHtml(repoName));
    actionsEl.innerHTML = h('a', { href: repoUrl, class: 'btn btn-primary', target: '_blank', rel: 'noopener' }, UI.repos.viewOnGitHub)
      + anchor(repoUrl + '/archive/refs/heads/' + currentBranch + '.zip', 'btn btn-secondary', UI.repos.downloadZip);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-secondary';
    copyBtn.textContent = UI.repos.clone;
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(cloneUrl);
        copyBtn.textContent = UI.repos.copied;
        setTimeout(() => { copyBtn.textContent = UI.repos.clone; }, 2000);
      } catch (_) {
        copyBtn.textContent = UI.repos.copyError;
        setTimeout(() => { copyBtn.textContent = UI.repos.clone; }, 2000);
      }
    };
    actionsEl.appendChild(copyBtn);

    if (repo.description) {
      const existingDesc = header.querySelector('.repo-desc');
      if (existingDesc) existingDesc.remove();
      const d = document.createElement('p');
      d.className = 'repo-desc';
      d.textContent = repo.description;
      header.appendChild(d);
    }

    // releases
    try {
      const releases = await cachedApiGet('/repos/' + USER + '/' + encodeURIComponent(repoName) + '/releases?per_page=5');
      if (releases && releases.length > 0) {
        releaseSection.classList.remove('hidden');
        const releasesHref = './?' + encodeURIComponent(repoName) + (currentFile ? '/' + encodeURIComponent(currentFile) : '') + '#releases';
        const releasesBtn = document.createElement('a');
        releasesBtn.href = releasesHref;
        releasesBtn.className = 'btn btn-secondary';
        releasesBtn.textContent = UI.repos.releases;
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
            assetsHtml = '<div class="release-assets">'
              + rel.assets.map(asset =>
                h('a', { href: asset.browser_download_url, class: 'release-asset-link', download: '' }, escapeHtml(asset.name))
              ).join('')
              + '</div>';
          }

          const tag = rel.tag_name ? h('a', { href: rel.html_url, class: 'release-tag', target: '_blank', rel: 'noopener' }, escapeHtml(rel.tag_name)) : '';
          const date = rel.published_at
            ? new Date(rel.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : '';
          const name = escapeHtml(rel.name || rel.tag_name || UI.repos.untaggedRelease);
          item.innerHTML = tag + ' ' + span('release-name', name) + ' ' + span('release-date', date) + ' ' + assetsHtml;
          releaseList.appendChild(item);
        }

        // link releases heading to GitHub
        var rh = document.getElementById('release-heading');
        rh.href = repoUrl + '/releases';
        rh.target = '_blank';
        rh.rel = 'noopener';
      }
    } catch (_) {}

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
          content = await rawFetch(RAW_BASE + '/' + encodeURIComponent(repoName) + '/' + currentBranch + '/' + candidate);
          actualFile = candidate;
          break;
        } catch (_) {}
      }
    } else {
      try {
        const path = actualFile.replace(/\\/g, '/').split('/').map(s => encodeURIComponent(s)).join('/');
        content = await rawFetch(RAW_BASE + '/' + encodeURIComponent(repoName) + '/' + currentBranch + '/' + path);
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
        contentEl.innerHTML = h('pre', null, h('code', 'language-' + lang, escapeHtml(content)));
      }
      try {
        contentEl.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
      } catch (_) {}

      // ── copy button for code blocks ──
      const U = UI.repos;
contentEl.querySelectorAll('pre').forEach(pre => {
        if (pre.parentElement?.classList.contains('code-block')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block';
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = U.copyIcon;
        btn.onclick = async () => {
          try {
            await navigator.clipboard.writeText(pre.querySelector('code')?.textContent || pre.textContent);
            btn.textContent = U.copyOk;
            setTimeout(() => { btn.textContent = U.copyIcon; }, 2000);
          } catch (_) {
            btn.textContent = U.copyFail;
            setTimeout(() => { btn.textContent = U.copyIcon; }, 2000);
          }
        };
        pre.parentElement.insertBefore(wrapper, pre);
        wrapper.appendChild(btn);
        wrapper.appendChild(pre);
      });

      // ── heading anchor clicks ──
      contentEl.querySelectorAll('.heading-anchor').forEach(el => {
        el.onclick = (e) => {
          e.preventDefault();
          scrollToHeading(el.dataset.slug, el.dataset.url);
        };
      });
    } else {
      const displayName = fileName || 'README';
      contentEl.innerHTML = p('not-found-message', UI.repos.fileNotFound, h('br'),
        anchor(repoUrl, 'not-found-link', UI.repos.openOnGitHub));
    }

    show('repo-view');
  } catch (e) {
    if (e.message === 'RATE_LIMITED') showError(UI.repos.errorRateLimited);
    else if (e.message === 'NOT_FOUND') showError(UI.repos.errorRepoNotFound(escapeHtml(repoName)));
    else showError(UI.repos.errorLoading(escapeHtml(repoName), e.message));
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