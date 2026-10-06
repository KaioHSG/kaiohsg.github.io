# K A I O H S G . D E V

Um site pessoal com estética **Web 1.0** — border ridge, marquee, neon, Comic Sans,
fundo estrelado e aquele cheirinho de internet discada.

Cada repositório vira uma página automaticamente. Basta escrever um `README.md`
num repo público que o site já renderiza.

## Features

- **🏠 Homepage** retrô com estrelas, marquee, badges e contador de visitas
- **📂 Repos** — lista dinâmica de todos os repositórios via GitHub API (cacheada)
- **📖 Leitor de README** — renderiza qualquer `.md` ou `.txt` de qualquer repo
- **📦 Releases** — botões de download pros assets das releases
- **🎨 CSS por repo** — cada repositório pode ter seu próprio tema via `repos/css/{nome}.css`
- **🔄 Reset automático** — `reset.css` zera o tema retrô pra quem tem CSS customizado
- **🏷️ Badges shields.io** — parametrizáveis via CSS custom properties (`--shields-style`, `--shields-color`)
- **🔗 Links curtos** — `kaiohsg.dev/repos/?gguard` (sem `repo=`)
- **📄 TXT raw** — arquivos `.txt` são renderizados como texto puro em `<pre>`

## URLs

```text
/                                      → Homepage retrô
/repos/                                → Lista de repositórios
/repos/?gguard                         → README do repo (formato curto)
/repos/?repo=gguard&file=GG-Script.md  → Arquivo específico
/repos/?ezcab&file=README.txt          → TXT renderizado raw
```

## Estrutura

```text
/
├── index.html                        Homepage Web 1.0
├── assets/css/global.css             Tema retrô (estrelas, neon, marquee)
├── repos/
│   ├── index.html                    Estrutura do navegador
│   ├── style.css                     Tema retrô adaptado pros repos
│   ├── md-to-html.js                 Motor: GitHub API + Markdown
│   └── css/
│       ├── reset.css                 Zera o tema retrô (base neutra)
│       └── {repo}.css                CSS customizado por repositório
├── 404.html
├── favicon.ico
└── CNAME                             → kaiohsg.dev
```

## Configuração

No topo do `repos/md-to-html.js`:

```js
const CONFIG = {
  allowedRepos: [],            // [] = todos; ou ["repo1", "repo2"]
  excludeRepos: [],            // repos ocultos da listagem
  allowedExtensions: ['.md', '.txt'],
};
```

## CSS por repositório

Crie um arquivo em `repos/css/{nome-do-repo}.css`. Exemplo:

```css
/* repos/css/photogimp-windows.css */
body { background: #fff; font-family: sans-serif; }
#container { max-width: 900px; margin: 0 auto; background: #fff; border-radius: 8px; }
```

Se o arquivo existir, o JS carrega **`reset.css`** primeiro (zera o tema retrô) e depois o CSS do repo. Se não existir, o tema retrô padrão é mantido.

## Shields.io badges

Controlados por CSS custom properties no `:root`. Dois lugares:

**`repos/style.css`** (tema retrô — padrão):

```css
:root {
  --shields-style: plastic;
  --shields-color: ff00ff;
}
```

**`repos/css/reset.css`** (tema limpo — pra quem tem CSS próprio):

```css
:root {
  --shields-style: flat;
  --shields-color: none;   /* none = não passa o parâmetro color */
}
```

O JS lê essas variáveis do CSS e aplica `?style=...&color=...` na URL do shields.io.  
Se o valor for `none` ou vazio, o parâmetro não é adicionado.

## API Cache

As chamadas pra GitHub API são cacheadas no `localStorage` por 1 hora pra não
estourar o rate limit (60 req/h sem token). Dá pra forçar refresh limpando
o localStorage do navegador.

## Tech Stack

- HTML5 + CSS3
- JavaScript (vanilla)
- GitHub REST API v3
- [marked.js](https://marked.js.org/) — renderizador Markdown
- [highlight.js](https://highlightjs.org/) — syntax highlighting
- [shields.io](https://shields.io/) — badges

## Contato

```text
✉️ contato@kaiohsg.dev
💻 github.com/KaioHSG
```

---

<p align="center">
  <sub>Feito com ❤️ desde 2026 • KaioHSG</sub>
</p>