import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { test } from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("MCP server lists Codex bridge tools", async () => {
  const serverPath = path.resolve("dist", "src", "index.js");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    stderr: "pipe"
  });
  const client = new Client({
    name: "codex-antigravity-bridge-smoke",
    version: "0.1.0"
  });

  await client.connect(transport);
  try {
    const listed = await client.listTools();
    const toolNames = listed.tools.map((tool) => tool.name).sort();
    assert.deepEqual(toolNames, [
      "codex_adversarial_review",
      "codex_cancel",
      "codex_rescue",
      "codex_result",
      "codex_resume_candidate",
      "codex_review",
      "codex_setup",
      "codex_status"
    ]);
  } finally {
    await client.close();
  }
});

test("built server does not print non-MCP text on stdout before initialization", async () => {
  const serverPath = path.resolve("dist", "src", "index.js");
  const child = spawn(process.execPath, [serverPath], {
    stdio: ["pipe", "pipe", "pipe"]
  });

  let stdout = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString("utf8");
  });

  await new Promise((resolve) => setTimeout(resolve, 150));
  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("close", resolve));
  assert.equal(stdout, "");
});
