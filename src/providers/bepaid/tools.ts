import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { assertWriteAllowed, type AppConfig } from "../../config.js";
import type { ProviderModule } from "../types.js";
import { BePaidApiError, BePaidClient } from "./client.js";
import {
  createKrokPaymentInputSchema,
  createPaymentInputSchema,
  deletePaymentInputSchema,
  getPaymentInputSchema,
  getTransactionInputSchema,
} from "./schemas.js";

function textResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text:
          typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(err: unknown) {
  if (err instanceof BePaidApiError) {
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
  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: message }],
  };
}

function requireClient(config: AppConfig): BePaidClient {
  if (!config.bepaid) {
    throw new Error(
      "bePaid credentials missing. Set BEPAID_SHOP_ID and BEPAID_SECRET_KEY.",
    );
  }
  return new BePaidClient(config.bepaid);
}

export const bepaidProvider: ProviderModule = {
  id: "bepaid",
  register(server: McpServer, config: AppConfig) {
    if (!config.bepaid) {
      return;
    }

    server.tool(
      "bepaid_erip_create_payment",
      "bePaid ERIP: create a payment request (POST /beyag/payments, payment_method.type=erip). Returns uid, status, ERIP instructions and QR when provided by the API.",
      createPaymentInputSchema,
      async (args) => {
        try {
          assertWriteAllowed(config);
          const client = requireClient(config);

          const paymentMethod: Record<string, unknown> = {
            type: "erip",
            account_number: args.account_number,
            service_no: args.service_no,
          };
          if (args.service_info) paymentMethod.service_info = args.service_info;
          if (args.receipt) paymentMethod.receipt = args.receipt;
          if (args.erip_devices) paymentMethod.erip_devices = args.erip_devices;

          const request: Record<string, unknown> = {
            amount: args.amount,
            currency: args.currency ?? "BYN",
            description: args.description,
            payment_method: paymentMethod,
          };

          if (args.order_id !== undefined) request.order_id = args.order_id;
          if (args.tracking_id) request.tracking_id = args.tracking_id;
          if (args.email) request.email = args.email;
          if (args.ip) request.ip = args.ip;
          if (args.notification_url)
            request.notification_url = args.notification_url;
          if (args.expired_at) request.expired_at = args.expired_at;
          if (args.permanent !== undefined) request.permanent = args.permanent;
          if (args.customer) request.customer = args.customer;
          if (args.test !== undefined) request.test = args.test;
          else if (config.env === "sandbox") request.test = true;

          const additional: Record<string, unknown> = {};
          if (args.notifications) additional.notifications = args.notifications;
          if (args.receipt_text) additional.receipt_text = args.receipt_text;
          if (Object.keys(additional).length > 0) {
            request.additional_data = additional;
          }

          const result = await client.createEripPayment({ request });
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.tool(
      "bepaid_erip_get_payment",
      "bePaid ERIP: get payment request details (GET /beyag/payments/:uid or GET /beyag/payments/?order_id=...). Provide uid or order_id.",
      getPaymentInputSchema,
      async (args) => {
        try {
          const client = requireClient(config);
          if (!args.uid && !args.order_id) {
            throw new Error("Provide either uid or order_id.");
          }
          if (args.uid && args.order_id) {
            throw new Error("Provide only one of uid or order_id, not both.");
          }
          const result = args.uid
            ? await client.getEripPaymentByUid(args.uid)
            : await client.getEripPaymentByOrderId(args.order_id!);
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.tool(
      "bepaid_erip_delete_payment",
      "bePaid ERIP: delete (cancel) a pending/permanent payment request (DELETE /beyag/payments/:uid). Sets status to deleted.",
      deletePaymentInputSchema,
      async (args) => {
        try {
          assertWriteAllowed(config);
          const client = requireClient(config);
          const result = await client.deleteEripPayment(args.uid);
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.tool(
      "bepaid_krok_create_payment",
      "bePaid KROK: create payment (POST /beyag/transactions/payments, method.type=krok). Returns QR / bank deeplinks when provided. Shop must be registered for KROK.",
      createKrokPaymentInputSchema,
      async (args) => {
        try {
          assertWriteAllowed(config);
          const client = requireClient(config);

          const method: Record<string, unknown> = { type: "krok" };
          if (args.service_info) method.service_info = args.service_info;

          const request: Record<string, unknown> = {
            amount: args.amount,
            currency: args.currency ?? "BYN",
            description: args.description,
            method,
          };

          if (args.tracking_id) request.tracking_id = args.tracking_id;
          if (args.email) request.email = args.email;
          if (args.ip) request.ip = args.ip;
          if (args.language) request.language = args.language;
          if (args.notification_url)
            request.notification_url = args.notification_url;
          if (args.return_url) request.return_url = args.return_url;
          if (args.expired_at) request.expired_at = args.expired_at;
          if (args.test !== undefined) request.test = args.test;
          else if (config.env === "sandbox") request.test = true;

          const result = await client.createKrokPayment({ request });
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.tool(
      "bepaid_krok_get_transaction",
      "bePaid KROK (or any APM transaction): get by uid (GET /beyag/transactions/:uid).",
      getTransactionInputSchema,
      async (args) => {
        try {
          const client = requireClient(config);
          const result = await client.getTransactionByUid(args.uid);
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );
  },
};
