import { z } from "zod";

export const ResponseFormatSchema = z.enum(["markdown", "json"]).default("markdown");

export const BaseToolSchema = {
  cwd: z
    .string()
    .optional()
    .describe("Repository or workspace directory. Defaults to the MCP server process cwd."),
  response_format: ResponseFormatSchema.describe("Return markdown for people or json for structured processing.")
};

export const SetupSchema = z.object({
  ...BaseToolSchema
}).strict();

export const ReviewScopeSchema = z.enum(["auto", "working-tree", "branch"]).default("auto");

export const ReviewSchema = z.object({
  ...BaseToolSchema,
  base: z.string().optional().describe("Base branch/ref for branch review, equivalent to --base."),
  scope: ReviewScopeSchema.optional().describe("Review target selection when base is not supplied."),
  model: z.string().optional().describe("Optional Codex model override."),
  background: z.boolean().default(false).describe("Run in a detached background process.")
}).strict();

export const AdversarialReviewSchema = z.object({
  ...BaseToolSchema,
  base: z.string().optional().describe("Base branch/ref for branch review, equivalent to --base."),
  scope: ReviewScopeSchema.optional().describe("Review target selection when base is not supplied."),
  model: z.string().optional().describe("Optional Codex model override."),
  focus: z.string().optional().describe("Extra challenge-review focus text."),
  background: z.boolean().default(false).describe("Run in a detached background process.")
}).strict();

export const EffortSchema = z.enum(["none", "minimal", "low", "medium", "high", "xhigh"]);

export const RescueSchema = z.object({
  ...BaseToolSchema,
  prompt: z.string().optional().describe("Task for Codex to investigate, fix, or continue."),
  prompt_file: z.string().optional().describe("Path to a file containing the prompt."),
  background: z.boolean().default(false).describe("Run as a background companion task."),
  write: z
    .boolean()
    .optional()
    .describe("Allow Codex to edit files. If omitted, rescue defaults to write-capable unless the prompt is clearly read-only."),
  resume: z.boolean().default(false).describe("Resume the latest tracked Codex task thread."),
  fresh: z.boolean().default(false).describe("Force a new Codex task thread."),
  model: z.string().optional().describe("Optional Codex model override. The bridge preserves 'spark' alias behavior."),
  effort: EffortSchema.optional().describe("Optional Codex reasoning effort.")
}).strict();

export const ResumeCandidateSchema = z.object({
  ...BaseToolSchema
}).strict();

export const StatusSchema = z.object({
  ...BaseToolSchema,
  job_id: z.string().optional().describe("Optional job id or unique prefix."),
  all: z.boolean().default(false).describe("Show more recent jobs instead of the compact default."),
  wait: z.boolean().default(false).describe("Wait until the selected job finishes."),
  timeout_ms: z.number().int().positive().optional().describe("Timeout for wait mode.")
}).strict();

export const ResultSchema = z.object({
  ...BaseToolSchema,
  job_id: z.string().optional().describe("Optional job id or unique prefix. Defaults to latest finished job.")
}).strict();

export const CancelSchema = z.object({
  ...BaseToolSchema,
  job_id: z.string().optional().describe("Optional active job id or unique prefix. Required if multiple jobs are active.")
}).strict();
