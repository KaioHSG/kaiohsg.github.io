# K A I O H S G . D E V

Personal website with a **Web 1.0** aesthetic — border ridge, marquee, neon, Comic Sans,
starfield background, and that dial-up internet smell.

Each repository becomes a page automatically. Just write a `README.md` in a public repo
and the site renders it.

## Features

- **🏠 Homepage** retro with stars, marquee, badges, and visitor counter
- **📂 Repos** — dynamic list of all repos via GitHub API (cached)
- **📖 README viewer** — renders any `.md` or `.txt` from any repo
- **📦 Releases** — download buttons for release assets
- **🎨 Per-repo CSS** — each repo can have its own theme via `repos/css/{name}.css`
- **🔄 Standard CSS** — `.std.css` files completely replace the retro theme
- **🏷️ Shields.io badges** — configurable via `UI.repos.shields` in `ui.js`
- **🔗 Short URLs** — `kaiohsg.dev/repos/?gguard` (no `repo=`)
- **📄 TXT raw** — `.txt` files rendered as plain text in `<pre>`

## URLs

```text
/                                       → Retro homepage
/repos/                                 → Repo list
/repos/?gguard                          → Repo README (short form)
/repos/?repo=gguard&file=GG-Script.md   → Specific file
/repos/?ezcab&file=README.txt           → Raw TXT rendering
```

## Structure

```text
/
├── assets/
│   ├── css/global.css     Shared retro theme (stars, neon, marquee)
│   └── js/ui.js           UI content strings + JSX-like HTML helpers
├── repos/
│   ├── css/
│   │   ├── {repo}.std.css     Standard CSS (replaces retro theme entirely)
│   │   └── {repo}.css         Override CSS (keeps retro theme as base)
│   ├── repo-tree/
│   │   ├── config.js      Backend config (API, rules, extension mappings)
│   │   ├── utils.js        Utility functions (escape, parser, view switcher, CSS loader)
│   │   ├── renderer.js     Custom marked.js Markdown renderer
│   │   ├── api.js          GitHub API client with localStorage cache
│   │   └── app.js          App orchestrator (pure logic, no content or styles)
│   ├── index.html          Repo browser HTML
│   └── style.css           Retro theme adapted for the repo browser
├── 404-icon.ico
├── 404.html
├── CNAME
├── copypasta.txt
├── favicon.ico
├── index.html               Web 1.0 homepage (Portuguese)
└── README.md
```

## Architecture

The project follows a strict separation of concerns:

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Content** | `assets/js/ui.js` | All UI strings, labels, messages, and icons |
| **Style** | `*.css` files | All visual presentation via CSS classes |
| **Logic** | `repos/repo-tree/*.js` | Pure behavior — no hardcoded strings or inline styles |
| **Config** | `repos/repo-tree/config.js` | Backend settings only (API, rules, state) |
| **Structure** | `*.html` | Bare HTML with CSS classes — no inline styles |

JS files act only as hooks for CSS and HTML. Styling is done exclusively via CSS classes,
and all user-facing text comes from `UI.*` in `assets/js/ui.js`.

## Configuration

### Backend (`repos/repo-tree/config.js`)

```js
const CONFIG = {
  allowedRepos: [],            // [] = all repos; or ["repo1", "repo2"]
  excludeRepos: [],            // repos hidden from listing
  allowedExtensions: ['.md', '.txt'],
  excludeExtensions: [],
  extensionToLang: { '.md': 'markdown', '.js': 'javascript', ... },
};
```

### UI content (`assets/js/ui.js`)

```js
const UI = {
  home: { counter: { base: 42000, range: 9000, ... } },
  repos: {
    pageTitle: 'Repos \u2014 KaioHSG.Dev',
    shields: { style: 'plastic', color: 'ff00ff' },
    // ... all text strings
  }
};
```

## Per-repo CSS

Create a file at `repos/css/{repo-name}.std.css` (replaces retro theme entirely)
or `repos/css/{repo-name}.css` (overrides on top of retro theme).

```css
/* repos/css/photogimp-windows.std.css */

body {
  background: #fff;
  font-family: sans-serif;
}
```

## JSX-like HTML helpers

Available globally from `assets/js/ui.js`:

```js
div('my-class', 'content')                       // <div class="my-class">content</div>
p('info', span('bold', 'text'), ' more')          // <p class="info"><span class="bold">text</span> more</p>
anchor('/url', 'btn', 'Click me')                 // <a href="/url" class="btn">Click me</a>
img('/pic.png', 'alt text')                       // <img src="/pic.png" alt="alt text">
h('section', { id: 'main' }, 'content')           // <section id="main">content</section>
```

## Shields.io badges

Configured in `assets/js/ui.js`:

```js
UI.repos.shields = { style: 'plastic', color: 'ff00ff' }
```

Set to `'none'` or empty to omit a parameter.

## API Cache

GitHub API calls are cached in `localStorage` for 1 hour to avoid rate limits
(60 req/h without token). Force refresh by clearing browser localStorage.

## Tech Stack

- HTML5 + CSS3
- JavaScript (vanilla)
- GitHub REST API v3
- [marked.js](https://marked.js.org/) — Markdown renderer
- [highlight.js](https://highlightjs.org/) — syntax highlighting
- [shields.io](https://shields.io/) — badges

## Contact

```text
✉️ contato@kaiohsg.dev
💻 github.com/KaioHSG
```

---

<p align="center">
  <sub>Made with ❤️ since 2026 • KaioHSG</sub>
</p>