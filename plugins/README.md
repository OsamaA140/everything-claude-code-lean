# Plugins and Marketplaces

Plugins extend Claude Code with extra tools/capabilities. Marketplaces are repos of installable plugins.

```bash
# Add a marketplace
claude plugin marketplace add https://github.com/anthropics/claude-plugins-official
claude plugin marketplace add https://github.com/mixedbread-ai/mgrep

# Install
/plugins                                          # browse UI
claude plugin install typescript-lsp@claude-plugins-official
```

## Worth Having
Dev: `typescript-lsp`, `pyright-lsp`, `hookify` (create hooks conversationally), `code-simplifier`.
Quality: `code-review`, `pr-review-toolkit`, `security-guidance`.
Search: `mgrep` (better than ripgrep), `context7` (live doc lookup).
Workflow: `commit-commands`, `frontend-design`, `feature-dev`.

## File Locations
```
~/.claude/plugins/
  cache/                    # downloaded plugins
  installed_plugins.json
  known_marketplaces.json
  marketplaces/
```
