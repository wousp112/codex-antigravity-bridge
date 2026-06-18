---
description: Cancel an active background Codex job in this repository
argument-hint: '[job-id]'
disable-model-invocation: true
allowed-tools: Bash(node:*)
---

!`node "${CODEX_PLUGIN_ROOT:-$HOME/.gemini/antigravity-cli/plugins/codex}/scripts/codex-companion.mjs" cancel "$ARGUMENTS"`
