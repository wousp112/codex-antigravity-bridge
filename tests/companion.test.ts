import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { optionArgs, resolveCwd } from "../src/companion.js";
import { COMPANION_SCRIPT, VENDOR_ROOT } from "../src/constants.js";
import { defaultRescueWrite, setupResultWithoutDeferredReviewGate } from "../src/tools.js";

test("optionArgs preserves booleans and values", () => {
  assert.deepEqual(
    optionArgs([
      ["--cwd", "/tmp/repo"],
      ["--background", true],
      ["--write", false],
      ["--model", undefined],
      ["--timeout-ms", 1000]
    ]),
    ["--cwd", "/tmp/repo", "--background", "--timeout-ms", "1000"]
  );
});

test("resolveCwd returns an absolute path", () => {
  assert.equal(resolveCwd(".").startsWith("/"), true);
});

test("vendored companion runtime has required identity and entrypoint files", () => {
  assert.equal(fs.existsSync(COMPANION_SCRIPT), true);
  assert.equal(fs.existsSync(path.join(VENDOR_ROOT, ".claude-plugin", "plugin.json")), true);
  assert.equal(fs.existsSync(path.join(VENDOR_ROOT, "commands", "review.md")), true);
  assert.equal(fs.existsSync(path.join(VENDOR_ROOT, "commands", "rescue.md")), true);
  assert.equal(fs.existsSync(path.join(VENDOR_ROOT, "agents", "codex-rescue.md")), true);
  assert.equal(fs.existsSync(path.join(VENDOR_ROOT, "hooks", "hooks.json")), true);
  assert.equal(fs.existsSync(path.join(VENDOR_ROOT, "prompts", "adversarial-review.md")), true);
  assert.equal(fs.existsSync(path.join(VENDOR_ROOT, "schemas", "review-output.schema.json")), true);
});

test("root Antigravity plugin surfaces preserve command-first entrypoints", () => {
  const requiredFiles = [
    ".claude-plugin/plugin.json",
    "plugin.json",
    "commands/review.md",
    "commands/rescue.md",
    "commands/status.md",
    "agents/codex-rescue.md",
    "skills/codex-cli-runtime/SKILL.md",
    "hooks.json",
    "scripts/codex-companion.mjs"
  ];

  for (const file of requiredFiles) {
    assert.equal(fs.existsSync(path.resolve(file)), true, file);
  }

  const reviewCommand = fs.readFileSync(path.resolve("commands", "review.md"), "utf8");
  const rescueAgent = fs.readFileSync(path.resolve("agents", "codex-rescue.md"), "utf8");
  assert.equal(reviewCommand.includes("CLAUDE_PLUGIN_ROOT"), false);
  assert.equal(rescueAgent.includes("CLAUDE_PLUGIN_ROOT"), false);
  assert.equal(reviewCommand.includes("CODEX_PLUGIN_ROOT"), true);
  assert.equal(rescueAgent.includes("CODEX_PLUGIN_ROOT"), true);
});

test("rescue defaults to write-capable unless the prompt is clearly read-only", () => {
  assert.equal(defaultRescueWrite({ prompt: "fix the failing tests" }), true);
  assert.equal(defaultRescueWrite({ prompt: "继续实现这个移植版本" }), true);
  assert.equal(defaultRescueWrite({ prompt: "read-only diagnosis of the failure" }), false);
  assert.equal(defaultRescueWrite({ prompt: "只读分析这个错误" }), false);
  assert.equal(defaultRescueWrite({ prompt: "fix it", write: false }), false);
});

test("setup result hides deferred review-gate toggles", () => {
  const result = setupResultWithoutDeferredReviewGate({
    status: 0,
    stdout: "Ready\nOptional: run `/codex:setup --enable-review-gate` to require a fresh review before stop.\n",
    stderr: "",
    json: {
      ready: true,
      nextSteps: [
        "Install Codex with `npm install -g @openai/codex`.",
        "Optional: run `/codex:setup --enable-review-gate` to require a fresh review before stop."
      ]
    }
  });

  assert.equal(result.stdout.includes("enable-review-gate"), false);
  assert.deepEqual((result.json as { nextSteps: string[] }).nextSteps, ["Install Codex with `npm install -g @openai/codex`."]);
});
