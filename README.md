# codex-antigravity-bridge

`codex-antigravity-bridge` is a plugin-first Antigravity port of
[`openai/codex-plugin-cc`](https://github.com/openai/codex-plugin-cc).

The original project is a Claude Code plugin built around slash commands,
agents, skills, hooks, and a thin `codex-companion.mjs` runtime. This port keeps
that architecture as the primary path. The older MCP bridge remains as an
optional legacy adapter, not the main user experience.

## What It Ports

| Original Claude Code feature | Antigravity port |
| --- | --- |
| `/codex:setup` | `commands/setup.md` converted by Antigravity plugin loading |
| `/codex:review` | `commands/review.md` command-first review |
| `/codex:adversarial-review` | `commands/adversarial-review.md` command-first challenge review |
| `/codex:rescue` | `commands/rescue.md` routing to `agents/codex-rescue.md` |
| `codex:codex-rescue` subagent | `agents/codex-rescue.md` thin forwarder |
| `codex-cli-runtime` skill | `skills/codex-cli-runtime/SKILL.md` |
| prompt helper skills | `skills/gpt-5-4-prompting/` and `skills/codex-result-handling/` |
| Claude Stop review gate | root `hooks.json` plus adapted hook scripts, subject to Antigravity hook behavior |
| Codex companion runtime | `scripts/codex-companion.mjs` and `scripts/lib/` |

## Requirements

- Node.js 18.18 or newer
- OpenAI Codex CLI installed and authenticated
- Antigravity with plugin support

Check Codex readiness:

```bash
codex --version
codex login
```

## Install As An Antigravity Plugin

Validate from this repository:

```bash
agy plugin validate .
```

Install the full plugin runtime:

```bash
npm run plugin:install
```

The installer copies the complete plugin, including `scripts/`, to:

```bash
~/.gemini/antigravity-cli/plugins/codex
```

For local development without installing, set:

```bash
export CODEX_PLUGIN_ROOT="/absolute/path/to/codex-antigravity-bridge"
```

## Development Checks

```bash
npm install
npm run typecheck
npm test
npm run plugin:validate
npm run plugin:install
```

## Design Boundary

The primary migration is intentionally command/agent/skill-first. That matches
the original plugin's progressive-disclosure design: command text loads only
when invoked, rescue delegates to a thin subagent, and the subagent calls the
companion runtime once.

The TypeScript MCP server under `src/` is kept for compatibility with MCP-only
surfaces. It is not the preferred Antigravity path.

Hook support is included through `hooks.json`, but stop-gate blocking behavior
must be treated as verified only on Antigravity versions that process the hook
payload and blocking decision exactly as expected.

## License

Apache-2.0. See `LICENSE` and `NOTICE`.
