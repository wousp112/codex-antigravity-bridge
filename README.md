# codex-antigravity-bridge

`codex-antigravity-bridge` is a high-fidelity Antigravity migration of
[`openai/codex-plugin-cc`](https://github.com/openai/codex-plugin-cc).

The original project is a Claude Code plugin. This project keeps the useful
Codex companion runtime and replaces the Claude-specific shell with a local
stdio MCP server plus Antigravity skill assets.

## What It Ports

| Original Claude Code feature | Antigravity migration |
| --- | --- |
| `/codex:setup` | `codex_setup` MCP tool |
| `/codex:review` | `codex_review` MCP tool |
| `/codex:adversarial-review` | `codex_adversarial_review` MCP tool |
| `/codex:rescue` | `codex_rescue` MCP tool |
| `task-resume-candidate` helper | `codex_resume_candidate` MCP tool |
| `/codex:status` | `codex_status` MCP tool |
| `/codex:result` | `codex_result` MCP tool |
| `/codex:cancel` | `codex_cancel` MCP tool |
| `codex:codex-rescue` subagent | Antigravity skill guidance in `antigravity/skills/codex-bridge/SKILL.md` |
| Claude Stop review gate | Documented as a later JSON Hook migration, not enabled by default |

## Requirements

- Node.js 18.18 or newer
- OpenAI Codex CLI installed and authenticated
- Antigravity 2.0 with MCP server support

Check Codex readiness:

```bash
codex --version
codex login
```

## Build

```bash
npm install
npm run build
npm test
```

## Antigravity MCP Config

After building, add this server to Antigravity's `mcp_config.json`.

```json
{
  "mcpServers": {
    "codex-antigravity-bridge": {
      "command": "node",
      "args": [
        "/absolute/path/to/codex-antigravity-bridge/dist/src/index.js"
      ]
    }
  }
}
```

This repository also ships a copyable example at
`antigravity/mcp_config.example.json`.

## Tool Summary

- `codex_setup`: checks Node, npm, Codex CLI, Codex auth, and review-gate state.
- `codex_review`: runs the native Codex review against uncommitted changes or a base branch.
- `codex_adversarial_review`: runs a challenge review using the original adversarial prompt.
- `codex_rescue`: delegates investigation or implementation work to Codex. When `write` is omitted, implementation/fix-style prompts default to write-capable and read-only/review/diagnosis-style prompts stay read-only.
- `codex_resume_candidate`: checks whether rescue should continue a tracked Codex task thread.
- `codex_status`: lists active and recent Codex bridge jobs.
- `codex_result`: returns the stored final output for a finished job.
- `codex_cancel`: cancels an active job.

## Design Boundary

This is not a Claude Code plugin and does not install anything into Claude Code.
The migration keeps behavior parity by reusing the Codex companion runtime and
moving the entrypoint to MCP, which Antigravity can launch as a local process.

The Stop review gate is intentionally not active in the first migration because
Claude's `Stop` hook contract is not the same as Antigravity JSON Hooks. The
review-gate migration notes are in `docs/compatibility.md`.

The original Claude slash-command, subagent, and hook text is vendored under
`vendor/openai-codex-claude-plugin/` so parity can be audited against the
translated MCP and Antigravity skill surfaces.

## License

Apache-2.0. See `LICENSE` and `NOTICE`.
