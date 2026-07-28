import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "../config.js";

export type ProviderModule = {
  id: string;
  /** Register tools when credentials for this provider are present. */
  register(server: McpServer, config: AppConfig): void;
};
