/**
 * Guard rules for Claude Code hooks: dangerous shell commands and secret leaks.
 *
 * Pure functions, no I/O — unit-testable and reusable from any hook script.
 * Verdicts: 'block' (deny the tool call, exit 2), 'warn' (stderr note), 'ok'.
 */

// --- Dangerous Bash commands -------------------------------------------------

const BASH_BLOCK_RULES = [
  {
    re: /\brm\s+(-[a-zA-Z]*[rR][a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*[rR][a-zA-Z]*)\s+(["']?)(\/|~\/?|\$HOME\/?)\2(\s|$|;|&)/,
    msg: 'rm -rf targeting filesystem root or home directory'
  },
  {
    re: /\b(curl|wget)\b[^|;&]*\|\s*(sudo\s+)?(ba|z|da)?sh\b/,
    msg: 'piping a downloaded script straight into a shell — download, inspect, then run'
  },
  {
    re: /\bgit\s+push\b(?=[^|;&]*(\s--force\b(?!-with-lease)|\s-f\b))[^|;&]*\b(main|master)\b/,
    msg: 'force-push to main/master — use --force-with-lease on a feature branch'
  },
  {
    re: /\b(mkfs\.\w+|mkfs\s)|\bdd\b[^|;&]*\bof=\/dev\/(sd|disk|nvme)|>\s*\/dev\/(sd|disk|nvme)/,
    msg: 'raw disk write/format operation'
  },
  {
    re: /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/,
    msg: 'fork bomb'
  },
  {
    re: /\bchmod\s+(-[a-zA-Z]+\s+)*777\s+\//,
    msg: 'chmod 777 on a root-level path'
  }
];

const BASH_WARN_RULES = [
  {
    re: /\bgit\s+reset\s+--hard\b/,
    msg: 'git reset --hard discards uncommitted work — consider git stash first'
  },
  {
    re: /\bgit\s+clean\s+-[a-zA-Z]*f/,
    msg: 'git clean -f deletes untracked files permanently'
  },
  {
    re: /\bgit\s+(checkout|restore)\s+(--\s+)?\.(\s|$)/,
    msg: 'this discards all unstaged changes in the working tree'
  },
  {
    re: /\brm\s+-[a-zA-Z]*[rR][a-zA-Z]*f|\brm\s+-[a-zA-Z]*f[a-zA-Z]*[rR]/,
    msg: 'recursive force delete — double-check the target path'
  },
  {
    re: /--no-verify\b/,
    msg: 'skipping git hooks (--no-verify) bypasses checks'
  },
  {
    re: /\bgit\s+push\b[^|;&]*(\s--force\b(?!-with-lease)|\s-f\b)/,
    msg: 'force push — prefer --force-with-lease'
  }
];

/**
 * Check a shell command against block/warn rules.
 * @returns {{ verdict: 'block'|'warn'|'ok', messages: string[] }}
 */
function checkBashCommand(command) {
  const cmd = String(command || '');
  const blocks = BASH_BLOCK_RULES.filter(r => r.re.test(cmd)).map(r => r.msg);
  if (blocks.length) return { verdict: 'block', messages: blocks };

  const warns = BASH_WARN_RULES.filter(r => r.re.test(cmd)).map(r => r.msg);
  if (warns.length) return { verdict: 'warn', messages: warns };

  return { verdict: 'ok', messages: [] };
}

// --- Secret scanning ---------------------------------------------------------

const SECRET_BLOCK_PATTERNS = [
  { re: /AKIA[0-9A-Z]{16}/, name: 'AWS access key id' },
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, name: 'private key material' },
  { re: /\bgh[poasur]_[A-Za-z0-9]{36,}/, name: 'GitHub token' },
  { re: /\bgithub_pat_[A-Za-z0-9_]{22,}/, name: 'GitHub fine-grained PAT' },
  { re: /\bsk-ant-[A-Za-z0-9_-]{20,}/, name: 'Anthropic API key' },
  { re: /\bsk-(proj|live)-[A-Za-z0-9_-]{20,}/, name: 'OpenAI API key' },
  { re: /\b[srp]k_live_[A-Za-z0-9]{20,}/, name: 'Stripe live key' },
  { re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/, name: 'Slack token' },
  { re: /\bAIza[0-9A-Za-z_-]{35}\b/, name: 'Google API key' }
];

const SECRET_WARN_PATTERNS = [
  { re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/, name: 'JWT (may embed claims/secrets)' },
  {
    re: /\b(api[_-]?key|secret|token|password)\b\s*[:=]\s*["'][A-Za-z0-9_\-/+]{16,}["']/i,
    name: 'possible hardcoded credential'
  }
];

const PLACEHOLDER_RE = /YOUR_|EXAMPLE|PLACEHOLDER|CHANGE_?ME|XXXX|\.\.\.|<[^>]+>|\*{3,}/i;
const EXEMPT_PATH_RE = /\.(example|sample|template)(\.\w+)?$|\.env\.example$/;

/**
 * Scan text for likely secrets.
 * @param {string} text - file content or edit payload
 * @param {string} [filePath] - used to exempt template/example files
 * @returns {{ blocks: {line:number,name:string}[], warns: {line:number,name:string}[] }}
 */
function scanForSecrets(text, filePath = '') {
  const result = { blocks: [], warns: [] };
  if (!text || EXEMPT_PATH_RE.test(filePath)) return result;

  const lines = String(text).split('\n');
  lines.forEach((line, idx) => {
    if (PLACEHOLDER_RE.test(line)) return;
    for (const p of SECRET_BLOCK_PATTERNS) {
      if (p.re.test(line)) result.blocks.push({ line: idx + 1, name: p.name });
    }
    for (const p of SECRET_WARN_PATTERNS) {
      if (p.re.test(line)) result.warns.push({ line: idx + 1, name: p.name });
    }
  });

  return result;
}

// --- Stray documentation files ----------------------------------------------

const DOC_ALLOWED_NAME_RE =
  /(README|CHANGELOG|LICENSE|SECURITY|CLAUDE|AGENTS|CONTRIBUTING|SKILL|MEMORY|TASKS)\.(md|txt)$/i;
const DOC_ALLOWED_DIR_RE =
  /(^|\/)(docs|doc|rules|agents|commands|skills|memory|codemaps|examples|contexts|\.claude|\.github)\//;

/**
 * Should creating this file be blocked as a stray doc file?
 */
function isStrayDocFile(filePath) {
  const p = String(filePath || '');
  if (!/\.(md|txt)$/i.test(p)) return false;
  return !DOC_ALLOWED_NAME_RE.test(p) && !DOC_ALLOWED_DIR_RE.test(p);
}

module.exports = {
  checkBashCommand,
  scanForSecrets,
  isStrayDocFile
};
