import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppConfig } from "../../config.js";
import type { ProviderModule } from "../types.js";
import {
  buildAssistCreateBill,
  buildAssistPaymentCheckout,
} from "./checkout.js";

export const assistProvider: ProviderModule = {
  id: "assist",
  register(server: McpServer, config: AppConfig) {
    if (!config.assist) return;

    server.tool(
      "assist_build_payment_checkout",
      "Assist BY: build hosted payment POST fields for /pay/order.cfm (test.paysec.by in sandbox). Unverified live — needs merchant_Id from Assist.",
      {
        order_number: z.string(),
        order_amount: z.number().positive(),
        order_currency: z.string().default("BYN").optional(),
        order_comment: z.string().optional(),
        email: z.string().email().optional(),
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        url_return_ok: z.string().url().optional(),
        url_return_no: z.string().url().optional(),
      },
      async (args) => {
        const checkout = buildAssistPaymentCheckout({
          merchantId: config.assist!.merchantId,
          paymentBaseUrl: config.assist!.paymentBaseUrl,
          orderNumber: args.order_number,
          orderAmount: args.order_amount,
          orderCurrency: args.order_currency,
          orderComment: args.order_comment,
          email: args.email,
          firstName: args.first_name,
          lastName: args.last_name,
          urlReturnOk: args.url_return_ok,
          urlReturnNo: args.url_return_no,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  ...checkout,
                  usage:
                    "POST fields to action (browser form). Customer completes payment on Assist pages.",
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    server.tool(
      "assist_build_create_bill",
      "Assist BY: build createbill.cfm form fields (payment-by-link / invoice). Unverified live.",
      {
        bill_number: z.string(),
        bill_amount: z.number().positive(),
        bill_currency: z.string().default("BYN").optional(),
        bill_comment: z.string().optional(),
        customer_email: z.string().email().optional(),
      },
      async (args) => {
        const bill = buildAssistCreateBill({
          merchantId: config.assist!.merchantId,
          paymentBaseUrl: config.assist!.paymentBaseUrl,
          billNumber: args.bill_number,
          billAmount: args.bill_amount,
          billCurrency: args.bill_currency,
          billComment: args.bill_comment,
          customerEmail: args.customer_email,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  ...bill,
                  usage:
                    "POST to createbill; response may include payment token/link (see Assist docs).",
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
