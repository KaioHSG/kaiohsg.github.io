// ── UI Content ──

const UI = {
  home: {
    counter: { base: 42000, range: 9000, baseRef: 43000, rangeRef: 12000 }
  },

  repos: {
    siteName: 'KaioHSG.Dev',
    pageTitle: 'Repos \u2014 KaioHSG.Dev',
    subtitle: 'Projects, experiments &amp; random stuff on GitHub',
    searchPlaceholder: 'Search repos...',
    allLanguages: 'All languages',
    sortRecent: 'Recent',
    sortStars: 'Most stars',
    sortForks: 'Most forks',
    sortName: 'Name A\u2013Z',
    noDescription: '<em>no description</em>',
    noReposFound: 'No repositories found.',
    repoCount: (n, total) => n + ' / ' + total + ' repos',
    showReadme: '\u2190 Show README',
    viewOnGitHub: 'View on GitHub',
    downloadZip: '\u2B07 Download ZIP',
    clone: '\uD83D\uDCCB Clone',
    copied: '\u2713 Copied!',
    copyError: '\u2717 Error',
    releases: '\uD83D\uDCE6 Releases',
    fileNotFound: 'File not found in this repository.',
    openOnGitHub: 'Open on GitHub \u2192',
    backToAll: '\u2190 All repos',
    backToAllFooter: '\u2190 Back to all repos',
    loading: 'Loading repositories\u2026',
    errorLoad: 'Could not load repositories. Try again later.',
    errorRateLimited: 'GitHub API rate limit exceeded. Please try again later.',
    errorRepoNotFound: (name) => 'Repository "' + name + '" not found.',
    errorLoading: (name, msg) => 'Error loading "' + name + '": ' + (msg || 'unknown'),
    blockedAllowed: (exts) => 'Only ' + exts.join(', ') + ' files can be viewed.',
    blockedExcluded: (ext) => 'File type ' + ext + ' is excluded.',
    blockedTitle: (repo) => repo + ' \u2014 blocked',
    untaggedRelease: '(untagged)',
    copyIcon: '\uD83D\uDCCB',
    copyOk: '\u2713',
    copyFail: '\u2717',
    shields: { style: 'plastic', color: 'ff00ff' }
  }
};

// ── JSX-like HTML helpers ──

function escAttr(v) { return String(v).replace(/"/g, '&quot;'); }

function _h(tag, attrs) {
  let a = '';
  if (attrs) {
    const entries = Object.entries(attrs);
    for (let i = 0; i < entries.length; i++) {
      const [k, v] = entries[i];
      if (v !== null && v !== undefined && !(k === 'class' && v === ''))
        a += ' ' + k + '="' + escAttr(v) + '"';
    }
  }
  let c = '';
  for (let i = 2; i < arguments.length; i++) {
    const arg = arguments[i];
    if (Array.isArray(arg)) {
      for (let j = 0; j < arg.length; j++) {
        const x = arg[j];
        if (x !== null) c += x;
      }
    } else if (arg !== null) {
      c += arg;
    }
  }
  return '<' + tag + a + '>' + c + '</' + tag + '>';
}

function h(tag, attrs, ...children) {
  if (typeof attrs === 'string') {
    const cls = attrs.trim();
    return _h(tag, cls ? { class: cls } : null, ...children);
  }
  return _h(tag, attrs, ...children);
}

function anchor(href, cls, ...children) {
  return _h('a', { href, class: cls || undefined }, ...children);
}

function img(src, alt, cls) {
  return _h('img', { src, alt, class: cls || undefined });
}

const div   = (cls, ...children) => h('div', cls, ...children);
const p     = (cls, ...children) => h('p', cls, ...children);
const span  = (cls, ...children) => h('span', cls, ...children);
const pre   = (cls, ...children) => h('pre', cls, ...children);
const code  = (cls, ...children) => h('code', cls, ...children);