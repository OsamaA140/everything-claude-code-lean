#!/usr/bin/env node
/**
 * SessionStart Hook - Load previous context on new session
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Injects real context into the model via hookSpecificOutput.additionalContext
 * (stderr logs are visible to the user but never reach Claude).
 * Also cleans up stale tool-count files left by suggest-compact.
 */

const fs = require('fs');
const path = require('path');
const {
  getSessionsDir,
  getLearnedSkillsDir,
  getTempDir,
  findFiles,
  ensureDir,
  readFile,
  output,
  log
} = require('../lib/utils');
const { getPackageManager, getSelectionPrompt } = require('../lib/package-manager');

const MAX_NOTE_CHARS = 600;

function extractSessionNotes(sessionPath) {
  const content = readFile(sessionPath);
  if (!content) return null;
  // Pull the "Notes for Next Session" section if the template was filled in
  const m = content.match(/### Notes for Next Session\n([\s\S]*?)(\n###|\n---|$)/);
  const notes = m ? m[1].trim() : '';
  if (!notes || notes === '-') return null;
  return notes.slice(0, MAX_NOTE_CHARS);
}

function cleanupStaleCounters() {
  try {
    const tmp = getTempDir();
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    for (const name of fs.readdirSync(tmp)) {
      if (!name.startsWith('claude-tool-count-')) continue;
      const full = path.join(tmp, name);
      try {
        if (fs.statSync(full).mtimeMs < cutoff) fs.unlinkSync(full);
      } catch {
        // ignore files we can't stat/remove
      }
    }
  } catch {
    // temp dir unreadable - not worth failing session start
  }
}

async function main() {
  const sessionsDir = getSessionsDir();
  const learnedDir = getLearnedSkillsDir();

  ensureDir(sessionsDir);
  ensureDir(learnedDir);
  cleanupStaleCounters();

  const contextParts = [];

  const pm = getPackageManager();
  contextParts.push(`Package manager for this machine: ${pm.name} (${pm.source}).`);
  if (pm.source === 'fallback' || pm.source === 'default') {
    log('[SessionStart] No package manager preference found.');
    log(getSelectionPrompt());
  }

  const recentSessions = findFiles(sessionsDir, '*.tmp', { maxAge: 7 });
  if (recentSessions.length > 0) {
    const latest = recentSessions[0];
    log(`[SessionStart] ${recentSessions.length} recent session file(s); latest: ${latest.path}`);
    const notes = extractSessionNotes(latest.path);
    if (notes) {
      contextParts.push(`Notes from the previous session (${path.basename(latest.path)}):\n${notes}`);
    } else {
      contextParts.push(`Previous session log available at ${latest.path} (read it if continuity matters).`);
    }
  }

  const learnedSkills = findFiles(learnedDir, '*.md');
  if (learnedSkills.length > 0) {
    const names = learnedSkills.slice(0, 10).map(f => path.basename(f.path, '.md'));
    contextParts.push(
      `Learned skills available in ${learnedDir}: ${names.join(', ')} — read the file before applying one.`
    );
  }

  output({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: contextParts.join('\n\n')
    }
  });

  process.exit(0);
}

main().catch(err => {
  console.error('[SessionStart] Error:', err.message);
  process.exit(0); // Don't block on errors
});
