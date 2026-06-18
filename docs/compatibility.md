# Compatibility Matrix

This is the migration contract for the Antigravity port. The goal is to preserve
the original command/agent/skill/hook philosophy from `openai/codex-plugin-cc`,
not to replace it with a tool catalog.

| Feature | Original behavior | Antigravity port | Status |
| --- | --- | --- | --- |
| Plugin manifest | `.claude-plugin/plugin.json` | root `plugin.json` with the same plugin identity | Supported |
| Slash commands | `commands/*.md` loaded on `/codex:*` invocation | root `commands/*.md`; `agy plugin validate` converts 7 commands to skills | Supported |
| Normal review | `/codex:review` estimates scope, asks wait/background, then runs companion review | adapted `commands/review.md` preserves the same route and direct runtime call | Supported |
| Adversarial review | `/codex:adversarial-review` uses the original prompt/schema | adapted command plus unchanged `prompts/` and `schemas/` | Supported |
| Rescue command | `/codex:rescue` checks resume candidate and routes to subagent | adapted `commands/rescue.md` preserves the same decision flow | Supported |
| Rescue subagent | `agents/codex-rescue.md` is a thin one-call forwarder | same agent file adapted for Antigravity wording and plugin root | Supported |
| Runtime skill | `skills/codex-cli-runtime` constrains the rescue subagent | same skill adapted for Antigravity wording and plugin root | Supported |
| Companion runtime | `scripts/codex-companion.mjs` stores jobs and talks to Codex | same runtime, with Antigravity data fallback support | Supported |
| Status/result/cancel | command files call the companion runtime directly | adapted command files call the runtime directly | Supported |
| Hooks | Claude `hooks/hooks.json` registers SessionStart, SessionEnd, and Stop | root `hooks.json`; validator processes hooks, but exact Stop blocking semantics need runtime proof | Partially verified |
| MCP bridge | not part of the original design | not shipped | Removed |

## Route Contract

Trigger:
- User invokes or implies a `/codex:*` workflow in Antigravity.

Required Context:
- Current repository path.
- Installed plugin root, normally `~/.gemini/antigravity-cli/plugins/codex`.
- Whether the request is review-only, rescue, status/result/cancel, or setup.

Required Actions:
1. Let the Antigravity command/skill surface route the request.
2. Keep review commands read-only and return Codex output verbatim.
3. Keep rescue as a thin subagent handoff with exactly one companion `task` call.
4. Use the companion runtime for job state, result, cancel, and setup.

Gate State:
- `plugin_validate_passed`
- `commands_processed`
- `agents_processed`
- `skills_processed`
- `hooks_processed_or_limited`
- `companion_runtime_smoke_passed`
- `full_plugin_install_passed`

Stop Rule:
- Stop if `agy plugin validate .` does not process commands, agents, and skills.
- Stop if command text falls back to any external tool catalog as the primary route.
- Stop before claiming complete Stop-gate parity unless representative hook behavior was tested.

Completion Check:
- `agy plugin validate .` passes.
- `npm run plugin:install` copies the full runtime to the default plugin root and registers the plugin.
- `npm test` passes.
- A direct companion command works with `CODEX_PLUGIN_ROOT` set to this repo.
- Documentation states any remaining hook limitation plainly.
