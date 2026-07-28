import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "./config.js";
import { assistProvider } from "./providers/assist/tools.js";
import { bepaidProvider } from "./providers/bepaid/tools.js";
import { expressPayProvider } from "./providers/express-pay/tools.js";
import { hutkigroshProvider } from "./providers/hutkigrosh/tools.js";
import type { ProviderModule } from "./providers/types.js";
import { webpayProvider } from "./providers/webpay/tools.js";
import { registerDocResources } from "./resources/docs.js";

const providers: ProviderModule[] = [
  bepaidProvider,
  expressPayProvider,
  webpayProvider,
  hutkigroshProvider,
  assistProvider,
];

export function createServer(config: AppConfig): McpServer {
  const server = new McpServer({
    name: "erip-mcp",
    version: "0.1.2",
  });

  registerDocResources(server);

  for (const provider of providers) {
    provider.register(server, config);
  }

  return server;
}

export function activeProviderIds(config: AppConfig): string[] {
  const ids: string[] = [];
  if (config.bepaid) ids.push("bepaid");
  if (config.expressPay) ids.push("express-pay");
  if (config.webpay) ids.push("webpay");
  if (config.hutkigrosh) ids.push("hutkigrosh");
  if (config.assist) ids.push("assist");
  return ids;
}
