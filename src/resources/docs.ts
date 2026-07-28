import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function packageRoot(): string {
  // dist/resources → package root; src/resources → package root
  return join(__dirname, "..", "..");
}

function readDoc(relativePath: string): string {
  return readFileSync(join(packageRoot(), relativePath), "utf8");
}

export function registerDocResources(server: McpServer): void {
  server.resource(
    "erip-docs-overview",
    "erip://docs/overview",
    {
      mimeType: "text/markdown",
      description:
        "Overview of Belarus payment APIs including ERIP and aggregators",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: readDoc("docs/belarus-payment-apis.md"),
        },
      ],
    }),
  );

  server.resource(
    "erip-docs-legal",
    "erip://docs/legal",
    {
      mimeType: "text/markdown",
      description:
        "Preliminary legal research for a public ERIP MCP (not legal advice)",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: readDoc("docs/legal-research-belarus.md"),
        },
      ],
    }),
  );

  server.resource(
    "erip-docs-bepaid-erip",
    "erip://docs/bepaid-erip",
    {
      mimeType: "text/markdown",
      description: "bePaid ERIP integration notes and official doc links",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: `# bePaid ERIP (v1 provider)

Official docs:

- https://docs.bepaid.by/en/payment_methods/apms/erip/
- https://docs.bepaid.by/en/payment_methods/apms/erip/create_payment/
- https://docs.bepaid.by/en/payment_methods/apms/erip/webhooks/

## MCP tools (1:1)

| Tool | HTTP |
|------|------|
| \`bepaid_erip_create_payment\` | \`POST /beyag/payments\` (\`type: erip\`) |
| \`bepaid_erip_get_payment\` | \`GET /beyag/payments/:uid\` or \`?order_id=\` |
| \`bepaid_erip_delete_payment\` | \`DELETE /beyag/payments/:uid\` |

Auth: HTTP Basic with \`BEPAID_SHOP_ID\` + \`BEPAID_SECRET_KEY\`.

Amount is in **minor units** (1000 = 10.00 BYN).

For card acquiring tools, see the separate community package [bepaid-mcp](https://github.com/theYahia/bepaid-mcp) — this server focuses on ERIP only.
`,
        },
      ],
    }),
  );
}
