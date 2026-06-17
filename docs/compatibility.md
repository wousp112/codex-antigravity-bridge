# Compatibility Matrix

This matrix is the migration contract. The goal is practical behavior parity
with `openai/codex-plugin-cc`, while replacing Claude Code-specific surfaces.

| Feature | Original behavior | Migrated behavior | Status |
| --- | --- | --- | --- |
| Setup | Claude command runs `codex-companion setup`; can suggest global Codex install and Claude stop-gate setup | MCP tool runs the same readiness check but hides unsupported stop-gate toggles from Antigravity | Supported |
| Native review | Claude command calls Codex companion review, using native Codex reviewer | MCP tool calls the same companion review path | Supported |
| Background review | Claude launches the review Bash command in background | MCP tool detaches the companion review process and then polls bridge status for the job | Supported with process-level detach |
| Adversarial review | Claude command builds adversarial prompt and expects structured findings | MCP tool uses the same companion command and original prompt/schema | Supported |
| Rescue task | Claude subagent forwards to `codex-companion task`, defaulting to write-capable unless explicitly read-only/review/diagnosis/research | MCP tool forwards directly and applies the same default write/read-only split when `write` is omitted | Supported |
| Resume candidate | Claude command calls `task-resume-candidate --json` before ambiguous rescue routing | MCP exposes `codex_resume_candidate` for the same helper | Supported |
| Resume rescue | Claude asks whether to resume if a session candidate exists | Antigravity skill calls `codex_resume_candidate`, then passes `resume` or `fresh` into `codex_rescue` | Supported |
| Status | Claude command renders companion job state | MCP tool returns companion JSON plus readable text | Supported |
| Result | Claude command returns stored companion job result | MCP tool returns stored companion JSON plus readable text | Supported |
| Cancel | Claude command interrupts active app-server turn and kills process tree | MCP tool delegates to companion cancel | Supported |
| Rescue subagent | Claude `/agents` entry wraps one Bash call | Antigravity skill gives equivalent routing rules | Replaced |
| Stop review gate | Claude Stop hook blocks completion when review finds issues | Not enabled by default; requires Antigravity JSON Hook contract validation | Deferred |
| Original command/agent/hook text | Claude plugin ships slash-command, subagent, and hook manifests | Vendored under `vendor/openai-codex-claude-plugin/` for audit; Antigravity consumes translated skill/MCP surfaces | Preserved as source reference |

## Route Contract

Trigger:

- Antigravity user wants Codex review, adversarial review, rescue task,
  status/result/cancel, or setup checks.

Required Context:

- Current repository path.
- Whether the task is read-only review or write-capable rescue.
- Whether the user requested foreground/background execution.
- Whether resume/fresh routing is intended.

Required Actions:

1. Call the matching `codex_*` MCP tool.
2. Preserve user supplied base branch, model, effort, and focus text.
3. Use background mode for broad reviews/tasks that may run long.
4. For ambiguous rescue continuation, call `codex_resume_candidate` before `codex_rescue`.
5. Use `codex_status`, then `codex_result`, for background work.

Gate State:

- `codex_available`
- `codex_auth_checked`
- `repo_path_known`
- `write_mode_explicit`
- `resume_candidate_checked`
- `background_job_recorded`

Stop Rule:

- Stop if Codex is missing, unauthenticated, or the repository path is not a git repository.
- Stop before write-capable rescue if the user asked for read-only review.
- Stop before claiming Stop-hook parity; that migration is deferred.

Completion Check:

- The tool response contains either a final result or a job id/status pointer.
- Background work is visible through `codex_status`.
- Write-capable rescue says whether it may edit files.
- Ambiguous rescue routing has either a checked candidate or an explicit resume/fresh decision.

## Review Gate Notes

The original Claude plugin uses `hooks/hooks.json` with a `Stop` hook. Antigravity
2.0 advertises JSON Hooks, but this bridge does not assume the same event payload
or blocking semantics. A future migration can add an Antigravity hook only after
representative payloads prove:

- previous-turn edits can be identified reliably;
- a hook can block/allow agent completion;
- a timeout cannot trap the user in a loop;
- failures fail open or fail closed intentionally.
