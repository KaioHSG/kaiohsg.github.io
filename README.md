# KaioHSG.Dev

> **Bem-vindo ao meu pedaço da internet desde 2025.**
>
> Um site pessoal com estética **Web 1.0** — border ridge, marquee, neon, Comic Sans,
> fundo estrelado e aquele cheirinho de internet discada.

### ✨ Sobre

Este repositório é o código-fonte do meu site hospedado via **GitHub Pages**.
A ideia é simples: em vez de manter um site estático chato, cada repositório
meu vira uma página automaticamente. Basta escrever um `README.md` que o site
faz o resto.

### 🚀 Features

| Feature | Descrição |
|---------|-----------|
| **🏠 Homepage** | Tema GeoCities retrô com estrelas, badges e contador de visitas |
| **📂 Repos** | Lista dinâmica de todos os repositórios via API do GitHub |
| **📖 Leitor de README** | Renderiza qualquer `.md`/`.txt` de qualquer repo |
| **📦 Releases** | Botões de download direto pros assets das releases |
| **🎨 CSS por repo** | Cada repositório pode ter seu próprio CSS customizado |
| **🏷️ Badges shields.io** | Com suporte a estilo retrô via CSS custom properties |
| **🔗 Links curtos** | `kaiohsg.dev/repos/?gguard` (sem `repo=`) |

### 🌐 Como funciona

```
kaiohsg.dev                          → Homepage retrô
kaiohsg.dev/repos/                   → Lista de repositórios
kaiohsg.dev/repos/?gguard           → README do gguard
kaiohsg.dev/repos/?gguard&file=docs/guide.md  → Arquivo específico
kaiohsg.dev/qualquer-coisa          → 404 estilizado
```

### 📁 Estrutura

```
/
├── index.html               ★ Homepage Web 1.0
├── assets/
│   └── css/
│       └── global.css       ★ Tema retrô (fundo estrelado, neon, marquee)
├── repos/
│   ├── index.html           ★ Estrutura do navegador de repos
│   ├── style.css            ★ CSS retrô adaptado pros repos
│   └── md-to-html.js        ★ Motor: GitHub API + renderizador Markdown
├── 404.html                 ★ Página de erro temática
├── favicon.ico
└── CNAME                    → kaiohsg.dev
```

### ⚙️ Configuração

No topo do `repos/md-to-html.js`:

```js
const CONFIG = {
  allowedRepos: [],            // [] = todos; ou ["repo1", "repo2"]
  excludeRepos: [],            // repos ocultos da listagem
  allowedExtensions: ['.md', '.txt'],
};
```

### 🎭 Personalização por repo

Cada repositório pode ter seu próprio CSS via `CONFIG.repoCSS`:

```js
repoCSS: {
  'meu-repo-aqui': `
    .repo-title { color: #ff00ff; text-shadow: 0 0 20px #f0f; }
    :root { --shields-style: flat; --shields-color: ffcc00; }
  `
}
```

### 🛠️ Tech Stack

- **HTML5** + **CSS3**
- **JavaScript** (vanilla)
- **GitHub REST API v3**
- [marked.js](https://marked.js.org/) — renderizador Markdown
- [highlight.js](https://highlightjs.org/) — syntax highlighting
- [shields.io](https://shields.io/) — badges

### 📬 Contato

```text
✉️ contato@kaiohsg.dev
💻 github.com/KaioHSG
```

<p align="center">
  Feito com ❤️ desde 2026 • KaioHSG
</p>