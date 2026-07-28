import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppConfig } from "../../config.js";
import type { ProviderModule } from "../types.js";
import { buildWebpayEripCheckout } from "./signature.js";

export const webpayProvider: ProviderModule = {
  id: "webpay",
  register(server: McpServer, config: AppConfig) {
    if (!config.webpay) return;

    server.tool(
      "webpay_erip_build_checkout",
      "WEBPAY ERIP: build signed checkout form fields for POST to securesandbox.webpay.by or payment.webpay.by (wsb_tab=erip). Does not call WEBPAY — returns action URL + fields. Live verification requires merchant storeid/secret.",
      {
        order_num: z
          .string()
          .describe("Unique order id (must not start with 0 for ERIP)"),
        total: z
          .number()
          .positive()
          .describe("Total amount major units (e.g. 20.9)"),
        currency_id: z.string().default("BYN").optional(),
        store_name: z.string().optional(),
        return_url: z.string().url().optional(),
        cancel_return_url: z.string().url().optional(),
        notify_url: z.string().url().optional(),
        due_date_unix: z
          .number()
          .int()
          .optional()
          .describe("Unix timestamp until which ERIP invoice is payable"),
        seed: z.string().optional(),
        items: z
          .array(
            z.object({
              name: z.string(),
              quantity: z.number().positive(),
              price: z.number(),
            }),
          )
          .optional(),
      },
      async (args) => {
        const checkout = buildWebpayEripCheckout({
          storeId: config.webpay!.storeId,
          secretKey: config.webpay!.secretKey,
          paymentBaseUrl: config.webpay!.paymentBaseUrl,
          orderNum: args.order_num,
          total: args.total,
          currencyId: args.currency_id ?? "BYN",
          test: config.env === "production" ? 0 : 1,
          storeName: args.store_name,
          returnUrl: args.return_url,
          cancelReturnUrl: args.cancel_return_url,
          notifyUrl: args.notify_url,
          dueDateUnix: args.due_date_unix,
          seed: args.seed,
          items: args.items,
          tab: "erip",
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  ...checkout,
                  usage:
                    "POST fields to action URL (browser form or HTTP client). ERIP tab is preselected via wsb_tab=erip.",
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );
  },
};
