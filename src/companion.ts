import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

import {
  COMPANION_SCRIPT,
  DEFAULT_BACKGROUND_DISCOVERY_ATTEMPTS,
  DEFAULT_STATUS_POLL_MS,
  PACKAGE_NAME
} from "./constants.js";

export interface CompanionResult {
  status: number;
  stdout: string;
  stderr: string;
  json: unknown | null;
}

export interface ToolTextResult {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export interface CommandOptions {
  cwd?: string;
  responseFormat?: "markdown" | "json";
}

export function resolveCwd(cwd?: string): string {
  return path.resolve(cwd ?? process.cwd());
}

export function ensureVendorRuntime(): void {
  if (!fs.existsSync(COMPANION_SCRIPT)) {
    throw new Error(
      `Vendored Codex companion runtime not found at ${COMPANION_SCRIPT}. Run the package build from a complete checkout.`
    );
  }
}

export function companionEnv(cwd: string): NodeJS.ProcessEnv {
  const dataRoot =
    process.env.CODEX_ANTIGRAVITY_DATA ??
    process.env.CLAUDE_PLUGIN_DATA ??
    path.join(os.homedir(), ".codex-antigravity-bridge");
  return {
    ...process.env,
    CLAUDE_PLUGIN_DATA: dataRoot,
    CODEX_COMPANION_SESSION_ID:
      process.env.CODEX_COMPANION_SESSION_ID ?? `${PACKAGE_NAME}:${Buffer.from(cwd).toString("base64url").slice(0, 24)}`
  };
}

export function runCompanion(subcommand: string, args: string[], options: CommandOptions = {}): CompanionResult {
  ensureVendorRuntime();
  const cwd = resolveCwd(options.cwd);
  const result = spawnSync(process.execPath, [COMPANION_SCRIPT, subcommand, ...args], {
    cwd,
    env: companionEnv(cwd),
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  let parsed: unknown | null = null;
  if (stdout.trim()) {
    try {
      parsed = JSON.parse(stdout);
    } catch {
      parsed = null;
    }
  }

  return {
    status: result.status ?? (result.error ? 1 : 0),
    stdout,
    stderr,
    json: parsed
  };
}

export function spawnDetachedCompanion(subcommand: string, args: string[], cwdInput?: string): { pid: number | null } {
  ensureVendorRuntime();
  const cwd = resolveCwd(cwdInput);
  const child = spawn(process.execPath, [COMPANION_SCRIPT, subcommand, ...args], {
    cwd,
    env: companionEnv(cwd),
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });
  child.unref();
  return { pid: child.pid ?? null };
}

function latestMatchingJobId(statusJson: unknown, expectedKind: string): string | null {
  if (!statusJson || typeof statusJson !== "object") {
    return null;
  }
  const report = statusJson as { running?: unknown; recent?: unknown };
  const running = Array.isArray(report.running) ? (report.running as Array<Record<string, unknown>>) : [];
  const recent = Array.isArray(report.recent) ? (report.recent as Array<Record<string, unknown>>) : [];
  const match = [...running, ...recent].find((job) => job.kind === expectedKind || job.kindLabel === expectedKind);
  return typeof match?.id === "string" ? match.id : null;
}

export async function discoverBackgroundJob(cwd: string, expectedKind: string): Promise<string | null> {
  for (let index = 0; index < DEFAULT_BACKGROUND_DISCOVERY_ATTEMPTS; index += 1) {
    await delay(DEFAULT_STATUS_POLL_MS);
    const status = runCompanion("status", ["--json", "--all"], { cwd, responseFormat: "json" });
    const jobId = latestMatchingJobId(status.json, expectedKind);
    if (jobId) {
      return jobId;
    }
  }
  return null;
}

export function formatToolResult(
  result: CompanionResult,
  options: { responseFormat?: "markdown" | "json"; fallbackTitle?: string } = {}
): ToolTextResult {
  const responseFormat = options.responseFormat ?? "markdown";
  const structured = {
    ok: result.status === 0,
    exit_status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    json: result.json
  };

  if (responseFormat === "json") {
    return {
      content: [{ type: "text", text: JSON.stringify(structured, null, 2) }],
      structuredContent: structured,
      isError: result.status !== 0
    };
  }

  const body = result.stdout.trim() || result.stderr.trim() || `${options.fallbackTitle ?? "Codex command"} produced no output.`;
  return {
    content: [{ type: "text", text: body.endsWith("\n") ? body : `${body}\n` }],
    structuredContent: structured,
    isError: result.status !== 0
  };
}

export function optionArgs(pairs: Array<[string, string | number | boolean | undefined | null]>): string[] {
  const args: string[] = [];
  for (const [name, value] of pairs) {
    if (value === undefined || value === null || value === false) {
      continue;
    }
    if (value === true) {
      args.push(name);
      continue;
    }
    args.push(name, String(value));
  }
  return args;
}
