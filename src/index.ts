#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { PACKAGE_NAME, PACKAGE_VERSION } from "./constants.js";
import { registerCodexBridgeTools } from "./tools.js";

const server = new McpServer(
  {
    name: PACKAGE_NAME,
    version: PACKAGE_VERSION
  },
  {
    instructions:
      "Bridge Antigravity to OpenAI Codex. Use review tools for read-only review, adversarial_review for challenge review, rescue only for delegated investigation or implementation, then status/result for background jobs."
  }
);

registerCodexBridgeTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
