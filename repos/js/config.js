// ── constantes ──
const USER = 'KaioHSG';
const GITHUB_API = 'https://api.github.com';
const RAW_BASE = `https://raw.githubusercontent.com/${USER}`;

// ── configuração ──
const CONFIG = {
  allowedRepos: [],
  excludeRepos: [],
  allowedExtensions: ['.md', '.txt']
};

// ── estado global ──
let currentRepo = null;
let currentBranch = 'main';
let currentFile = null;