# Review Checklist

Use this checklist before publishing a release.

- Setup parity: `codex_setup` reports Node, npm, Codex, auth, runtime state.
- Review parity: `codex_review` supports working tree and base branch review.
- Adversarial parity: `codex_adversarial_review` accepts focus text and uses the original prompt/schema path.
- Rescue parity: `codex_rescue` supports foreground/background, write/read-only, resume/fresh, model, and effort.
- Resume parity: `codex_resume_candidate` exposes the original `task-resume-candidate` helper.
- Job parity: `codex_status`, `codex_result`, and `codex_cancel` operate on the same companion state.
- Antigravity parity: `antigravity/mcp_config.example.json` points to `dist/src/index.js`.
- Skill parity: `antigravity/skills/codex-bridge/SKILL.md` tells Antigravity when to call each tool.
- Safety: write mode is opt-in and review tools are read-only.
- Auditability: original Claude commands, agent, hooks, runtime, prompts, and schema are vendored for comparison.
- Packaging: `npm test` passes and `npm pack --dry-run` includes runtime, docs, and Antigravity assets.
