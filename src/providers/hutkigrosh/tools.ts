import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { assertWriteAllowed, type AppConfig } from "../../config.js";
import type { ProviderModule } from "../types.js";
import { HutkiApiError, HutkiClient } from "./client.js";

function textResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(err: unknown) {
  if (err instanceof HutkiApiError) {
    return {
      isError: true as const,
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { error: err.message, status: err.status, body: err.body },
            null,
            2,
          ),
        },
      ],
    };
  }
  return {
    isError: true as const,
    content: [
      {
        type: "text" as const,
        text: err instanceof Error ? err.message : String(err),
      },
    ],
  };
}

async function withSession<T>(
  config: AppConfig,
  fn: (client: HutkiClient) => Promise<T>,
): Promise<T> {
  if (!config.hutkigrosh) {
    throw new Error(
      "Hutki Grosh credentials missing. Set HUTKIGROSH_USER and HUTKIGROSH_PASSWORD.",
    );
  }
  const client = new HutkiClient(config.hutkigrosh);
  await client.logIn();
  try {
    return await fn(client);
  } finally {
    try {
      await client.logOut();
    } catch {
      /* ignore logout errors */
    }
  }
}

export const hutkigroshProvider: ProviderModule = {
  id: "hutkigrosh",
  register(server: McpServer, config: AppConfig) {
    if (!config.hutkigrosh) return;

    server.tool(
      "hutkigrosh_erip_create_bill",
      "Hutki Grosh ERIP: create bill (POST /API/v1/Invoicing/Bill). Requires merchant login. amt uses Hutki API units (see their Bill examples).",
      {
        erip_id: z.number().int().describe("ERIP service id assigned to merchant"),
        inv_id: z.string().describe("Merchant invoice / order id"),
        amt: z.number().describe("Bill amount (Hutki Bill.amt)"),
        curr: z.string().default("BYN").optional(),
        full_name: z.string().optional(),
        mobile_phone: z.string().optional(),
        email: z.string().optional(),
        full_address: z.string().optional(),
        info: z.string().optional(),
        product_desc: z.string().optional(),
        product_amt: z.number().optional(),
      },
      async (args) => {
        try {
          assertWriteAllowed(config);
          const result = await withSession(config, (client) =>
            client.createBill({
              eripId: args.erip_id,
              invId: args.inv_id,
              amt: args.amt,
              curr: args.curr ?? "BYN",
              fullName: args.full_name,
              mobilePhone: args.mobile_phone,
              email: args.email,
              fullAddress: args.full_address,
              info: args.info,
              products: [
                {
                  desc: args.product_desc ?? args.info ?? "Payment",
                  count: 1,
                  amt: args.product_amt ?? args.amt,
                },
              ],
            }),
          );
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.tool(
      "hutkigrosh_erip_get_bill",
      "Hutki Grosh ERIP: get bill (GET /Invoicing/Bill({billId}))",
      { bill_id: z.union([z.string(), z.number()]) },
      async (args) => {
        try {
          const result = await withSession(config, (c) =>
            c.getBill(args.bill_id),
          );
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.tool(
      "hutkigrosh_erip_get_bill_status",
      "Hutki Grosh ERIP: bill status (GET /Invoicing/BillStatus({billId}))",
      { bill_id: z.union([z.string(), z.number()]) },
      async (args) => {
        try {
          const result = await withSession(config, (c) =>
            c.getBillStatus(args.bill_id),
          );
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.tool(
      "hutkigrosh_erip_delete_bill",
      "Hutki Grosh ERIP: delete unpaid bill (DELETE /Invoicing/Bill({billId}))",
      { bill_id: z.union([z.string(), z.number()]) },
      async (args) => {
        try {
          assertWriteAllowed(config);
          const result = await withSession(config, (c) =>
            c.deleteBill(args.bill_id),
          );
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.tool(
      "hutkigrosh_erip_list_bills",
      "Hutki Grosh ERIP: list bills (GET /Invoicing/Bills(start,count,sort))",
      {
        start: z.number().int().default(0).optional(),
        count: z.number().int().default(30).optional(),
        sort_type: z.number().int().default(1).optional(),
      },
      async (args) => {
        try {
          const result = await withSession(config, (c) =>
            c.listBills(args.start ?? 0, args.count ?? 30, args.sort_type ?? 1),
          );
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.tool(
      "hutkigrosh_erip_get_qrcode",
      "Hutki Grosh ERIP: bill QR (GET /Invoicing/BillQRCode(...))",
      {
        bill_id: z.union([z.string(), z.number()]),
        result_type: z.number().int().default(0).optional(),
        width: z.number().int().default(174).optional(),
        height: z.number().int().default(386).optional(),
      },
      async (args) => {
        try {
          const result = await withSession(config, (c) =>
            c.getBillQrCode(
              args.bill_id,
              args.result_type ?? 0,
              args.width ?? 174,
              args.height ?? 386,
            ),
          );
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );
  },
};
