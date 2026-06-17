**Findings First**

1. **Medium: `codex_rescue` write-mode parity is weaker than upstream.**  
   Local bridge defaults rescue to read-only unless `write: true` is explicitly set: [src/schemas.ts](/Users/wousp/General%20Chatbox/codex-antigravity-bridge/src/schemas.ts:44) and forwards `--write` only from that flag: [src/tools.ts](/Users/wousp/General%20Chatbox/codex-antigravity-bridge/src/tools.ts:177). Upstream rescue defaults to write-capable for fix/implementation unless explicitly read-only: [/plugins/codex/agents/codex-rescue.md](/Users/wousp/General%20Chatbox/research/codex-plugin-cc/plugins/codex/agents/codex-rescue.md:34) and [/plugins/codex/skills/codex-cli-runtime/SKILL.md](/Users/wousp/General%20Chatbox/research/codex-plugin-cc/plugins/codex/skills/codex-cli-runtime/SKILL.md:24).  
   Impact: an Antigravity/manual MCP call for “fix this” can silently run read-only unless the model remembers to set `write: true`.

2. **Medium: resume-candidate negotiation is not ported as a functional surface.**  
   Upstream `/codex:rescue` calls `task-resume-candidate --json` and asks continue-vs-new-thread when needed: [/plugins/codex/commands/rescue.md](/Users/wousp/General%20Chatbox/research/codex-plugin-cc/plugins/codex/commands/rescue.md:23). Local bridge exposes only `resume`/`fresh` booleans and a skill heuristic: [src/schemas.ts](/Users/wousp/General%20Chatbox/codex-antigravity-bridge/src/schemas.ts:46), [antigravity/skills/codex-bridge/SKILL.md](/Users/wousp/General%20Chatbox/codex-antigravity-bridge/antigravity/skills/codex-bridge/SKILL.md:27).  
   Impact: Antigravity cannot reliably reproduce upstream’s “candidate exists, ask once” behavior without a dedicated MCP tool or status field.

3. **Medium: setup exposes review-gate toggles even though Antigravity hook parity is deferred.**  
   Local `codex_setup` accepts `enable_review_gate` / `disable_review_gate`: [src/schemas.ts](/Users/wousp/General%20Chatbox/codex-antigravity-bridge/src/schemas.ts:13) and forwards them: [src/tools.ts](/Users/wousp/General%20Chatbox/codex-antigravity-bridge/src/tools.ts:79). But docs state the Stop review gate is not active and needs a future Antigravity hook contract: [docs/compatibility.md](/Users/wousp/General%20Chatbox/codex-antigravity-bridge/docs/compatibility.md:61).  
   Impact: users can toggle state that has no Antigravity enforcement effect, which is misleading for setup parity.

4. **Low: review/background command glue is thinner than upstream.**  
   Upstream review commands inspect git status/diff and ask wait-vs-background with a recommendation: [/plugins/codex/commands/review.md](/Users/wousp/General%20Chatbox/research/codex-plugin-cc/plugins/codex/commands/review.md:18). Local skill only says broad/unclear reviews should prefer background: [antigravity/skills/codex-bridge/SKILL.md](/Users/wousp/General%20Chatbox/codex-antigravity-bridge/antigravity/skills/codex-bridge/SKILL.md:26), while the tool default is foreground: [src/schemas.ts](/Users/wousp/General%20Chatbox/codex-antigravity-bridge/src/schemas.ts:21).  
   Impact: usable, but not full command-behavior parity.

5. **Low: package lock metadata is stale for the bin path.**  
   `package.json` points the bin to `./dist/src/index.js`: [package.json](/Users/wousp/General%20Chatbox/codex-antigravity-bridge/package.json:7), but `package-lock.json` still records `dist/index.js`: [package-lock.json](/Users/wousp/General%20Chatbox/codex-antigravity-bridge/package-lock.json:15).  
   Impact: likely not what `npm pack` will use, but it is packaging drift and should be cleaned before release.

No blocking issue found for basic MCP startup/tool discovery. The vendored runtime scripts match upstream; the only missing vendored directories are Claude-specific `commands/`, `agents/`, `hooks/`, `skills/`, and plugin `LICENSE`, which is expected for an MCP migration if the replacement surfaces are intentional.

Verified: `node --test dist/tests/*.test.js` passed 5/5. `codex-companion status --json` returned valid bridge state. `npm pack --dry-run` could not be verified because this read-only environment hit `EPERM` writing `~/.npm/_cacache/tmp`.

Residual risks: no tests currently exercise actual MCP `callTool` behavior for setup/review/rescue/status/result/cancel, background job lifecycle, resume/fresh routing, write-mode forwarding, or packaged tarball contents.

## Resolution After Review

- Fixed Medium 1: `codex_rescue` now defaults to write-capable for implementation/fix-style prompts when `write` is omitted, while preserving explicit `write: false` and clear read-only/diagnosis/research prompts.
- Fixed Medium 2: added the `codex_resume_candidate` MCP tool, backed by the original `task-resume-candidate` companion helper, and updated the Antigravity skill to ask continue-vs-new-thread when a candidate exists.
- Fixed Medium 3: removed public setup review-gate toggles from the MCP schema and filtered unsupported review-gate setup hints from bridge setup output.
- Improved Low 4: expanded the Antigravity skill with the original review wait-vs-background decision rules; the Stop-hook style automatic gate remains intentionally deferred.
- Fixed Low 5: refreshed `package-lock.json`; the bin path now records `dist/src/index.js`.
- Added audit material: vendored original Claude command, subagent, and hook text under `vendor/openai-codex-claude-plugin/`.
- Added tests for the new tool list, vendored source references, rescue write defaulting, and setup review-gate filtering.
