# codex-antigravity-bridge

`codex-antigravity-bridge` is a plugin-first Antigravity port of
[`openai/codex-plugin-cc`](https://github.com/openai/codex-plugin-cc).

The original project is a Claude Code plugin built around slash commands,
agents, skills, hooks, and a thin `codex-companion.mjs` runtime. This port keeps
that architecture directly. It does not expose a companion MCP server.

## What It Ports

| Original Claude Code feature | Antigravity port |
| --- | --- |
| `/codex:setup` | `commands/setup.md` converted by Antigravity plugin loading |
| `/codex:review` | `commands/review.md` command-first review |
| `/codex:adversarial-review` | `commands/adversarial-review.md` command-first challenge review |
| `/codex:rescue` | `commands/rescue.md` routing to `agents/codex-rescue.md` |
| `codex:codex-rescue` subagent | `agents/codex-rescue.md` thin forwarder |
| `codex-cli-runtime` skill | `skills/codex-cli-runtime/SKILL.md` |
| prompt helper skills | `skills/codex-prompting/` and `skills/codex-result-handling/` |
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

The installer copies the complete plugin, including `scripts/`, to both
Antigravity runtimes:

```bash
~/.gemini/antigravity-cli/plugins/codex
~/.gemini/config/plugins/codex
```

For local development without installing, set:

```bash
export CODEX_PLUGIN_ROOT="/absolute/path/to/codex-antigravity-bridge"
```

## Development Checks

```bash
npm install
npm test
npm run plugin:validate
npm run plugin:install
```

## Model And Effort

The plugin leaves the Codex model unset by default. That preserves the original
plugin behavior and lets the local Codex runtime choose its configured default.

For rescue/task runs, pass an explicit model when needed:

```text
/codex:rescue --model gpt-5.5 --effort high fix the failing tests
```

`--effort` is accepted only by the rescue/task path and supports:

```text
none, minimal, low, medium, high, xhigh
```

Review commands use Codex's native review path. Codex may choose a review model
separately from the rescue/task model.

## Advisory Mode

For document, dissertation, job-search, and planning work, use the rescue command
as a read-only adviser. This asks Codex for a second opinion and returns the
advice to the current Antigravity conversation without letting Codex edit files:

```text
/codex:rescue --model gpt-5.5 --effort high read-only: advise Antigravity on how to improve this dissertation section. Do not edit files. Return concrete next steps for Antigravity to apply.
```

Use this pattern when you want Codex to critique, plan, compare options, or give
implementation guidance that the Antigravity model should then use.

## Design Boundary

The primary migration is intentionally command/agent/skill-first. That matches
the original plugin's progressive-disclosure design: command text loads only
when invoked, rescue delegates to a thin subagent, and the subagent calls the
companion runtime once.

No MCP bridge is shipped. X Search and CUA driver can still be installed as
separate Antigravity MCP servers, but they are independent from this Codex
plugin.

Hook support is included through `hooks.json`, but stop-gate blocking behavior
must be treated as verified only on Antigravity versions that process the hook
payload and blocking decision exactly as expected.

## License

Apache-2.0. See `LICENSE` and `NOTICE`.
