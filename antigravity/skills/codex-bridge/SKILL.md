---
name: codex-bridge
description: Route Antigravity review, challenge-review, and rescue requests to the codex-antigravity-bridge MCP tools.
---

# Codex Bridge

Use this skill when the user wants Antigravity to ask OpenAI Codex to review
code, challenge an implementation, investigate a bug, attempt a fix, continue
prior Codex work, or inspect Codex job status.

## Tool Routing

- Use `codex_setup` when the user asks whether Codex is installed, logged in, or ready.
- Use `codex_review` for a normal read-only code review.
- Use `codex_adversarial_review` for a review that should challenge design choices, assumptions, reliability, auth, data safety, or architecture.
- Use `codex_rescue` when the user wants Codex to investigate or implement.
- Use `codex_resume_candidate` before rescue when the user did not explicitly choose a fresh or resumed Codex task thread.
- Use `codex_status` to inspect background work.
- Use `codex_result` to read a completed job.
- Use `codex_cancel` to cancel an active job.

## Review Rules

- Normal review and adversarial review are read-only.
- Do not fix issues, apply patches, or say you are about to make changes after a review call.
- If the user explicitly asks to wait, set `background: false`.
- If the user explicitly asks for background, set `background: true`.
- If the user does not choose foreground/background, estimate scope from git status/diff when available.
- Recommend foreground only for a clearly tiny review, roughly one or two files with no broader directory-sized change.
- In every other case, including unclear size, prefer `background: true`.
- For normal review, do not add focus text. Use adversarial review for custom review framing or design challenge.

## Rescue Rules

- Do not use write-capable rescue unless the user asks Codex to fix, implement, modify, or continue implementation.
- If the request is read-only diagnosis, research, or review, keep `write: false`.
- If the request is an implementation or fix request, set `write: true`; the MCP tool also defaults this way when `write` is omitted.
- If the user says continue, resume, apply the top fix, keep going, or dig deeper, call `codex_rescue` with `resume: true` unless they asked for a fresh run.
- If the user explicitly asks for a new thread, call `codex_rescue` with `fresh: true`.
- If neither resume nor fresh is explicit, call `codex_resume_candidate` first.
- If a resume candidate exists, ask whether to continue the current Codex thread or start a new one.
- If no resume candidate exists, route the rescue normally without asking.
- For small bounded rescue tasks, foreground is acceptable. For complicated, open-ended, multi-step, or long-running work, prefer background.
- Preserve explicit model and effort settings.
- Use `spark` only when the user asks for Spark; the bridge maps it to the Codex model alias.

## Completion Check

- Foreground calls should return Codex output directly.
- Background calls should return a job id or clear status pointer.
- After a background call, use `codex_status` before claiming completion.
- Return Codex's result without rewriting the substance of the findings.
