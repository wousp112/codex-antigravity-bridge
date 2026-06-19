#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_ROOT = path.resolve(SCRIPT_DIR, "..");
const CLI_TARGET_ROOT = path.join(os.homedir(), ".gemini", "antigravity-cli", "plugins", "codex");
const GUI_TARGET_ROOT = path.join(os.homedir(), ".gemini", "config", "plugins", "codex");

const EXCLUDED_NAMES = new Set([".git", "node_modules", "dist", ".DS_Store"]);

function copyTree(source, target) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      if (EXCLUDED_NAMES.has(entry)) {
        continue;
      }
      copyTree(path.join(source, entry), path.join(target, entry));
    }
    return;
  }
  fs.copyFileSync(source, target);
}

function main() {
  for (const targetRoot of [CLI_TARGET_ROOT, GUI_TARGET_ROOT]) {
    fs.rmSync(targetRoot, { recursive: true, force: true });
    copyTree(SOURCE_ROOT, targetRoot);
  }

  const install = spawnSync("agy", ["plugin", "install", CLI_TARGET_ROOT], {
    cwd: CLI_TARGET_ROOT,
    encoding: "utf8",
    stdio: "inherit"
  });

  if (install.status !== 0) {
    process.exit(install.status ?? 1);
  }

  process.stdout.write(`Installed codex Antigravity CLI plugin at ${CLI_TARGET_ROOT}\n`);
  process.stdout.write(`Installed codex Antigravity GUI plugin at ${GUI_TARGET_ROOT}\n`);
}

main();
