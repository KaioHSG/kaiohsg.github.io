// ── renderizador customizado para marked ──

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