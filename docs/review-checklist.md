# Review Checklist

Use this checklist before publishing a release.

- Plugin parity: root `plugin.json` exists and `agy plugin validate .` passes.
- Install parity: `npm run plugin:install` copies the full runtime to the Antigravity plugin root and registers it.
- Command parity: 7 root `commands/*.md` files exist and call `scripts/codex-companion.mjs` directly.
- Agent parity: `agents/codex-rescue.md` remains a thin forwarder and does not inspect or solve work itself.
- Skill parity: original internal skills exist under `skills/` and preserve rescue/runtime constraints.
- Runtime parity: root `scripts/` contains the companion runtime and original support libraries.
- Hook parity: root `hooks.json` validates; unsupported Stop blocking behavior is documented instead of overstated.
- No-MCP parity: no `src/`, `legacy-mcp/`, MCP SDK dependency, package bin, or MCP config example is shipped.
- Packaging: `npm test`, `npm run plugin:validate`, `npm run plugin:install`, and `npm pack --dry-run` pass.
