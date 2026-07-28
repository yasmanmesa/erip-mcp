import { describe, expect, it } from "vitest";
import { ExpressPayClient } from "./client.js";

/**
 * Live e2e against Express-Pay public sandbox.
 * Docs: https://express-pay.by/docs/api/v1 (Тестовые API ключи)
 *
 * Run:
 *   ERIP_MCP_LIVE=1 npm test -- src/providers/express-pay/e2e.test.ts
 */
const live = process.env.ERIP_MCP_LIVE === "1";

const SANDBOX_TOKEN = "a75b74cbcfe446509e8ee874f421bd66";
const SANDBOX_SECRET = "sandbox.expresspay.by";
const SANDBOX_BASE = "https://sandbox-api.express-pay.by/v1";

describe.runIf(live)("Express-Pay sandbox e2e", () => {
  const client = new ExpressPayClient({
    token: SANDBOX_TOKEN,
    secretWord: SANDBOX_SECRET,
    apiBaseUrl: SANDBOX_BASE,
  });

  it("lists invoices", async () => {
    const result = await client.listInvoices();
    expect(result).toBeTruthy();
  }, 30_000);

  it("creates, gets status, and cancels an invoice", async () => {
    const accountNo = `e2e-${Date.now()}`;
    const created = (await client.createInvoice({
      AccountNo: accountNo,
      Amount: 1.01,
      Currency: 933,
      Info: "erip-mcp e2e test",
      ReturnInvoiceUrl: 1,
      LifeTime: 3600,
    })) as { InvoiceNo?: number | string; InvoiceId?: number | string };

    const invoiceNo = created.InvoiceNo ?? created.InvoiceId;
    expect(invoiceNo).toBeTruthy();

    const status = await client.getInvoiceStatus(invoiceNo!);
    expect(status).toBeTruthy();

    const detail = await client.getInvoice(invoiceNo!);
    expect(detail).toBeTruthy();

    const canceled = await client.cancelInvoice(invoiceNo!);
    expect(canceled).toBeTruthy();
  }, 60_000);
});
