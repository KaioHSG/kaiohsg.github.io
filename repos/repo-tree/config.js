// ── constants ──
const USER = 'KaioHSG';
const GITHUB_API = 'https://api.github.com';
const RAW_BASE = 'https://raw.githubusercontent.com/' + USER;

// ── config (backend only) ──
const CONFIG = {
  allowedRepos: [],
  excludeRepos: [],
  allowedExtensions: [],
  excludeExtensions: [],
  extensionToLang: {
    '.json': 'json',
    '.sh': 'bash',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.css': 'css',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.html': 'html',
    '.py': 'python',
    '.rb': 'ruby',
    '.php': 'php',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.sql': 'sql',
    '.xml': 'xml',
    '.svg': 'xml',
    '.toml': 'toml',
    '.ini': 'ini',
    '.cfg': 'ini',
    '.conf': 'ini',
    '.env': 'bash',
    '.gitignore': 'gitignore',
    '.dockerfile': 'dockerfile',
    '.md': 'markdown'
  }
};

// ── global state ──
let currentRepo = null;
let currentBranch = 'main';
let currentFile = null;