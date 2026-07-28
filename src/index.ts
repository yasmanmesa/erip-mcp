#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConfigError, loadConfig } from "./config.js";
import { activeProviderIds, createServer } from "./server.js";

async function main(): Promise<void> {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    const message = err instanceof ConfigError ? err.message : String(err);
    console.error(`[erip-mcp] ${message}`);
    process.exit(1);
  }

  const providers = activeProviderIds(config);
  if (providers.length === 0) {
    console.error(
      "[erip-mcp] No provider credentials set. Starting in docs-only mode (resources available). Set EXPRESS_PAY_TOKEN, BEPAID_*, WEBPAY_*, HUTKIGROSH_*, and/or ASSIST_MERCHANT_ID to enable tools.",
    );
  } else {
    console.error(
      `[erip-mcp] Providers: ${providers.join(", ")} | env=${config.env}`,
    );
  }

  const server = createServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("[erip-mcp] Fatal:", err);
  process.exit(1);
});
