import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  discoverBackgroundJob,
  type CompanionResult,
  formatToolResult,
  optionArgs,
  resolveCwd,
  runCompanion,
  spawnDetachedCompanion,
  type ToolTextResult
} from "./companion.js";
import {
  AdversarialReviewSchema,
  CancelSchema,
  RescueSchema,
  ResumeCandidateSchema,
  ResultSchema,
  ReviewSchema,
  SetupSchema,
  StatusSchema
} from "./schemas.js";

type SetupParams = typeof SetupSchema._type;
type ReviewParams = typeof ReviewSchema._type;
type AdversarialReviewParams = typeof AdversarialReviewSchema._type;
type RescueParams = typeof RescueSchema._type;
type ResumeCandidateParams = typeof ResumeCandidateSchema._type;
type StatusParams = typeof StatusSchema._type;
type ResultParams = typeof ResultSchema._type;
type CancelParams = typeof CancelSchema._type;

type RescueWriteInput = {
  prompt?: string;
  prompt_file?: string;
  resume?: boolean;
  write?: boolean;
};

function asResponseFormat(value: string | undefined): "markdown" | "json" {
  return value === "json" ? "json" : "markdown";
}

export function setupResultWithoutDeferredReviewGate(result: CompanionResult): CompanionResult {
  const filterHint = (value: unknown): value is string =>
    typeof value === "string" && !value.includes("enable-review-gate") && !value.includes("disable-review-gate");

  const json =
    result.json && typeof result.json === "object" && !Array.isArray(result.json)
      ? {
          ...result.json,
          nextSteps: Array.isArray((result.json as { nextSteps?: unknown }).nextSteps)
            ? ((result.json as { nextSteps: unknown[] }).nextSteps).filter(filterHint)
            : (result.json as { nextSteps?: unknown }).nextSteps
        }
      : result.json;

  const stdoutIsJson = result.stdout.trim().startsWith("{") && json !== result.json;
  const stdout = stdoutIsJson
    ? `${JSON.stringify(json, null, 2)}\n`
    : result.stdout
        .split(/\r?\n/)
        .filter((line) => !line.includes("enable-review-gate") && !line.includes("disable-review-gate"))
        .join("\n");

  return {
    ...result,
    stdout,
    json
  };
}

export function defaultRescueWrite(params: RescueWriteInput): boolean {
  if (params.write !== undefined) {
    return params.write;
  }
  const text = `${params.prompt ?? ""} ${params.prompt_file ?? ""}`.toLowerCase();
  const readOnlyPattern =
    /\b(read[- ]?only|review|diagnos(?:e|is|tic)?|investigat(?:e|ion)?|research|explain|analy[sz]e|inspect|audit)\b|只读|只看|审查|评审|诊断|调查|研究|解释|分析|检查|不要改|不修改/iu;
  if (readOnlyPattern.test(text)) {
    return false;
  }
  return Boolean(params.prompt || params.prompt_file || params.resume);
}

async function launchBackgroundReview(
  subcommand: "review" | "adversarial-review",
  args: string[],
  params: ReviewParams | AdversarialReviewParams,
  kind: "review" | "adversarial-review"
): Promise<ToolTextResult> {
  const cwd = resolveCwd(params.cwd);
  const launch = spawnDetachedCompanion(subcommand, ["--json", ...args], cwd);
  const jobId = await discoverBackgroundJob(cwd, kind);
  const payload = {
    ok: true,
    background: true,
    pid: launch.pid,
    job_id: jobId,
    status_hint: jobId ? `Use codex_status with job_id=${jobId}.` : "Use codex_status to find the newest running job."
  };

  return {
    content: [
      {
        type: "text",
        text: jobId
          ? `Codex ${kind} started in the background as ${jobId}.\n`
          : `Codex ${kind} started in the background (pid ${launch.pid ?? "unknown"}). Use codex_status to locate it.\n`
      }
    ],
    structuredContent: payload
  };
}

export function registerCodexBridgeTools(server: McpServer): void {
  server.registerTool(
    "codex_setup",
    {
      title: "Codex Setup",
      description: "Check whether local Codex is installed, authenticated, and ready for the Antigravity bridge.",
      inputSchema: SetupSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: SetupParams) => {
      const args = optionArgs([
        ["--cwd", params.cwd],
        ["--json", params.response_format === "json"]
      ]);
      const result = setupResultWithoutDeferredReviewGate(runCompanion("setup", args, {
        cwd: params.cwd,
        responseFormat: asResponseFormat(params.response_format)
      }));
      return formatToolResult(result, { responseFormat: asResponseFormat(params.response_format), fallbackTitle: "Codex setup" });
    }
  );

  server.registerTool(
    "codex_review",
    {
      title: "Codex Review",
      description: "Run a normal read-only Codex review against the current git state or a base branch.",
      inputSchema: ReviewSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: ReviewParams) => {
      const args = optionArgs([
        ["--cwd", params.cwd],
        ["--base", params.base],
        ["--scope", params.scope],
        ["--model", params.model],
        ["--json", params.response_format === "json"]
      ]);
      if (params.background) {
        return launchBackgroundReview("review", args, params, "review");
      }
      const result = runCompanion("review", args, {
        cwd: params.cwd,
        responseFormat: asResponseFormat(params.response_format)
      });
      return formatToolResult(result, { responseFormat: asResponseFormat(params.response_format), fallbackTitle: "Codex review" });
    }
  );

  server.registerTool(
    "codex_adversarial_review",
    {
      title: "Codex Adversarial Review",
      description: "Run a read-only Codex challenge review focused on design risks, hidden assumptions, and failure modes.",
      inputSchema: AdversarialReviewSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: AdversarialReviewParams) => {
      const args = [
        ...optionArgs([
          ["--cwd", params.cwd],
          ["--base", params.base],
          ["--scope", params.scope],
          ["--model", params.model],
          ["--json", params.response_format === "json"]
        ]),
        ...(params.focus ? [params.focus] : [])
      ];
      if (params.background) {
        return launchBackgroundReview("adversarial-review", args, params, "adversarial-review");
      }
      const result = runCompanion("adversarial-review", args, {
        cwd: params.cwd,
        responseFormat: asResponseFormat(params.response_format)
      });
      return formatToolResult(result, {
        responseFormat: asResponseFormat(params.response_format),
        fallbackTitle: "Codex adversarial review"
      });
    }
  );

  server.registerTool(
    "codex_rescue",
    {
      title: "Codex Rescue",
      description: "Delegate investigation or implementation work to Codex, with optional background execution and write mode.",
      inputSchema: RescueSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: RescueParams) => {
      const write = defaultRescueWrite(params);
      const args = [
        ...optionArgs([
          ["--cwd", params.cwd],
          ["--model", params.model],
          ["--effort", params.effort],
          ["--prompt-file", params.prompt_file],
          ["--background", params.background],
          ["--write", write],
          ["--resume", params.resume],
          ["--fresh", params.fresh],
          ["--json", params.response_format === "json"]
        ]),
        ...(params.prompt ? [params.prompt] : [])
      ];
      const result = runCompanion("task", args, {
        cwd: params.cwd,
        responseFormat: asResponseFormat(params.response_format)
      });
      return formatToolResult(result, { responseFormat: asResponseFormat(params.response_format), fallbackTitle: "Codex rescue" });
    }
  );

  server.registerTool(
    "codex_resume_candidate",
    {
      title: "Codex Resume Candidate",
      description: "Check whether the current Antigravity bridge session has a resumable Codex task thread.",
      inputSchema: ResumeCandidateSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: ResumeCandidateParams) => {
      const args = optionArgs([
        ["--cwd", params.cwd],
        ["--json", params.response_format === "json"]
      ]);
      const result = runCompanion("task-resume-candidate", args, {
        cwd: params.cwd,
        responseFormat: asResponseFormat(params.response_format)
      });
      return formatToolResult(result, {
        responseFormat: asResponseFormat(params.response_format),
        fallbackTitle: "Codex resume candidate"
      });
    }
  );

  server.registerTool(
    "codex_status",
    {
      title: "Codex Status",
      description: "Show active and recent Codex bridge jobs for the current repository.",
      inputSchema: StatusSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (params: StatusParams) => {
      const args = [
        ...optionArgs([
          ["--cwd", params.cwd],
          ["--all", params.all],
          ["--wait", params.wait],
          ["--timeout-ms", params.timeout_ms],
          ["--json", params.response_format === "json"]
        ]),
        ...(params.job_id ? [params.job_id] : [])
      ];
      const result = runCompanion("status", args, {
        cwd: params.cwd,
        responseFormat: asResponseFormat(params.response_format)
      });
      return formatToolResult(result, { responseFormat: asResponseFormat(params.response_format), fallbackTitle: "Codex status" });
    }
  );

  server.registerTool(
    "codex_result",
    {
      title: "Codex Result",
      description: "Show the stored final output for a finished Codex bridge job.",
      inputSchema: ResultSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (params: ResultParams) => {
      const args = [
        ...optionArgs([
          ["--cwd", params.cwd],
          ["--json", params.response_format === "json"]
        ]),
        ...(params.job_id ? [params.job_id] : [])
      ];
      const result = runCompanion("result", args, {
        cwd: params.cwd,
        responseFormat: asResponseFormat(params.response_format)
      });
      return formatToolResult(result, { responseFormat: asResponseFormat(params.response_format), fallbackTitle: "Codex result" });
    }
  );

  server.registerTool(
    "codex_cancel",
    {
      title: "Codex Cancel",
      description: "Cancel an active Codex bridge background job.",
      inputSchema: CancelSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (params: CancelParams) => {
      const args = [
        ...optionArgs([
          ["--cwd", params.cwd],
          ["--json", params.response_format === "json"]
        ]),
        ...(params.job_id ? [params.job_id] : [])
      ];
      const result = runCompanion("cancel", args, {
        cwd: params.cwd,
        responseFormat: asResponseFormat(params.response_format)
      });
      return formatToolResult(result, { responseFormat: asResponseFormat(params.response_format), fallbackTitle: "Codex cancel" });
    }
  );
}
