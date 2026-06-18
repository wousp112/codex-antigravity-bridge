import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

test("root Antigravity plugin surfaces preserve command-first entrypoints", () => {
  const requiredFiles = [
    ".claude-plugin/plugin.json",
    "plugin.json",
    "commands/adversarial-review.md",
    "commands/cancel.md",
    "commands/rescue.md",
    "commands/result.md",
    "commands/review.md",
    "commands/setup.md",
    "commands/status.md",
    "agents/codex-rescue.md",
    "skills/codex-cli-runtime/SKILL.md",
    "skills/codex-prompting/SKILL.md",
    "skills/codex-result-handling/SKILL.md",
    "hooks.json",
    "scripts/codex-companion.mjs",
    "scripts/lib/codex.mjs"
  ];

  for (const file of requiredFiles) {
    assert.equal(fs.existsSync(path.join(root, file)), true, file);
  }
});

test("plugin has no MCP server surface", () => {
  const forbiddenPaths = ["src", "legacy-mcp", "antigravity/mcp_config.example.json"];
  for (const file of forbiddenPaths) {
    assert.equal(fs.existsSync(path.join(root, file)), false, file);
  }

  const pkg = JSON.parse(read("package.json"));
  assert.equal(Boolean(pkg.bin), false);
  assert.equal(Boolean(pkg.dependencies?.["@modelcontextprotocol/sdk"]), false);
  assert.equal(pkg.files.includes("legacy-mcp/"), false);
  assert.equal(pkg.files.includes("dist/"), false);
});

test("model and effort are explicit runtime controls", () => {
  const companion = read("scripts/codex-companion.mjs");
  const rescue = read("commands/rescue.md");
  const agent = read("agents/codex-rescue.md");

  assert.equal(companion.includes("--model <model|spark>"), true);
  assert.equal(companion.includes("--effort <none|minimal|low|medium|high|xhigh>"), true);
  assert.equal(companion.includes("gpt-5.3-codex-spark"), true);
  assert.equal(rescue.includes("Leave `--effort` unset unless the user explicitly asks"), true);
  assert.equal(agent.includes("Leave model unset by default"), true);
  assert.equal(agent.includes("gpt-5.4-mini"), false);
});

test("prompting skill name is not tied to a stale model version", () => {
  const promptSkill = read("skills/codex-prompting/SKILL.md");
  const runtimeSkill = read("skills/codex-cli-runtime/SKILL.md");
  const agent = read("agents/codex-rescue.md");

  assert.equal(promptSkill.includes("name: codex-prompting"), true);
  assert.equal(runtimeSkill.includes("gpt-5-4-prompting"), false);
  assert.equal(agent.includes("gpt-5-4-prompting"), false);
});
