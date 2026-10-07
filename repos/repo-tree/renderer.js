// ── custom renderer for marked ──

function createRenderer(repo, branch, file) {
  const base = RAW_BASE + '/' + repo + '/' + branch + '/';
  const dir = file && file.includes('/') ? file.substring(0, file.lastIndexOf('/') + 1) : '';

  return {
    heading(text, level) {
      const slug = text.toLowerCase()
        .replace(/<[^>]*>/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      const url = './?' + encodeURIComponent(repo) + (file ? '/' + encodeURIComponent(file) : '') + '#' + slug;
      const anchor = h('a', {
        class: 'heading-anchor', href: url,
        'data-slug': slug, 'data-url': url
      }, '\uD83D\uDD17');
      return h('h' + level, { id: slug }, anchor, text);
    },

    link(href, title, text) {
      if (!href) return text;
      if (href.startsWith('http')) {
        return anchor(href, '', text);
      }
      if (/\.(md|txt)(#|$)/i.test(href)) {
        const [filePath, anchorHash] = href.split('#');
        let resolved = filePath;
        if (resolved.startsWith('/')) {
          resolved = resolved.substring(1);
        } else {
          resolved = resolved.replace(/^\.\//, '');
          resolved = dir + resolved;
        }
        if (!isFileAllowed(resolved)) {
          return anchor(href, '', text);
        }
        const aPart = anchorHash ? '#' + anchorHash : '';
        return anchor('./?' + encodeURIComponent(repo) + '/' + encodeURIComponent(resolved) + aPart, '', text);
      }
      return anchor(href, '', text);
    },

    image(href, title, text) {
      if (!href) return '';
      let src = href.startsWith('http') ? href : base + href.replace(/^\.\//, '');
      if (src.includes('shields.io')) {
        const root = getComputedStyle(document.documentElement);
        let s = root.getPropertyValue('--shields-style').trim();
        let c = root.getPropertyValue('--shields-color').trim();
        const shields = UI.repos.shields;
        if (!s || s === 'null') s = shields.style;
        if (!c || c === 'null') c = shields.color;
        const params = [];
        if (s && s !== 'none') params.push('style=' + s);
        if (c && c !== 'none') params.push('color=' + c);
        if (params.length)
          src += (src.includes('?') ? '&' : '?') + params.join('&');
      }
      return img(src, escapeHtml(text));
    },

    br() { return '<br>\n'; },
    paragraph(text) { return h('p', null, text) + '\n'; },

    list(text, ordered) {
      const tag = ordered ? 'ol' : 'ul';
      return h(tag, null, '\n' + text) + '\n';
    },
    listitem(text) { return h('li', null, text) + '\n'; },
    codespan(text) { return h('code', null, text); },
    del(text) { return h('del', null, text); },
    html(text) { return text; },

    code(text, lang) {
      return h('pre', null, h('code', lang ? 'language-' + lang : null, escapeHtml(text))) + '\n';
    },

    strong(text) { return h('strong', null, text); },
    em(text) { return h('em', null, text); },
    hr() { return '<hr>\n'; },
    blockquote(text) { return h('blockquote', null, text) + '\n'; },

    table(header, body) {
      if (body) return '<table>\n<thead>\n' + header + '</thead>\n<tbody>\n' + body + '</tbody>\n</table>\n';
      return '<table>\n' + header + '\n</table>\n';
    },
    tablerow(text) { return '<tr>' + text + '</tr>\n'; },
    tablecell(text, flags) {
      const tag = flags.header ? 'th' : 'td';
      const align = flags.align ? ' align="' + flags.align + '"' : '';
      return '<' + tag + align + '>' + text + '</' + tag + '>\n';
    },

    text(text) { return text; }
  };
}