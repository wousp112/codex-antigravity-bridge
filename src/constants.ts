import path from "node:path";
import { fileURLToPath } from "node:url";

export const PACKAGE_NAME = "codex-antigravity-bridge";
export const PACKAGE_VERSION = "0.1.0";

export const ROOT_DIR = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
export const VENDOR_ROOT = path.join(ROOT_DIR, "vendor", "openai-codex-claude-plugin");
export const COMPANION_SCRIPT = path.join(VENDOR_ROOT, "scripts", "codex-companion.mjs");

export const DEFAULT_STATUS_POLL_MS = 750;
export const DEFAULT_BACKGROUND_DISCOVERY_ATTEMPTS = 8;
