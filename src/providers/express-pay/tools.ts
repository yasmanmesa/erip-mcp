import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { assertWriteAllowed, type AppConfig } from "../../config.js";
import type { ProviderModule } from "../types.js";
import { ExpressPayApiError, ExpressPayClient } from "./client.js";
import {
  createInvoiceInputSchema,
  getInvoiceInputSchema,
  getQrCodeInputSchema,
  invoiceNoInputSchema,
  listInvoicesInputSchema,
} from "./schemas.js";

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
  if (err instanceof ExpressPayApiError) {
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

function requireClient(config: AppConfig): ExpressPayClient {
  if (!config.expressPay) {
    throw new Error(
      "Express-Pay credentials missing. Set EXPRESS_PAY_TOKEN (and EXPRESS_PAY_SECRET_WORD if signatures are required).",
    );
  }
  return new ExpressPayClient(config.expressPay);
}

export const expressPayProvider: ProviderModule = {
  id: "express-pay",
  register(server: McpServer, config: AppConfig) {
    if (!config.expressPay) {
      return;
    }

    server.tool(
      "express_pay_erip_list_invoices",
      "Express-Pay ERIP: list invoices (GET /v1/invoices). Sandbox: sandbox-api.express-pay.by",
      listInvoicesInputSchema,
      async (args) => {
        try {
          const client = requireClient(config);
          const result = await client.listInvoices({
            From: args.from,
            To: args.to,
            AccountNo: args.account_no,
            Status: args.status,
          });
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.tool(
      "express_pay_erip_create_invoice",
      "Express-Pay ERIP/E-POS: create invoice (POST /v1/invoices). Amount in major units; API uses comma decimals.",
      createInvoiceInputSchema,
      async (args) => {
        try {
          assertWriteAllowed(config);
          const client = requireClient(config);
          const result = await client.createInvoice({
            AccountNo: args.account_no,
            Amount: args.amount,
            Currency: args.currency ?? 933,
            Info: args.info,
            Expiration: args.expiration,
            LifeTime: args.lifetime_seconds,
            InvoiceType: args.invoice_type,
            ReturnInvoiceUrl: args.return_invoice_url ?? 1,
            Surname: args.surname,
            FirstName: args.first_name,
            Patronymic: args.patronymic,
            City: args.city,
            Street: args.street,
            House: args.house,
            Building: args.building,
            Apartment: args.apartment,
            EmailNotification: args.email_notification,
            SmsPhone: args.sms_phone,
            IsNameEditable: args.is_name_editable,
            IsAddressEditable: args.is_address_editable,
            IsAmountEditable: args.is_amount_editable,
          });
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.tool(
      "express_pay_erip_get_invoice",
      "Express-Pay ERIP: invoice details (GET /v1/invoices/{InvoiceNo})",
      getInvoiceInputSchema,
      async (args) => {
        try {
          const client = requireClient(config);
          const result = await client.getInvoice(
            args.invoice_no,
            args.return_invoice_url ?? 1,
          );
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.tool(
      "express_pay_erip_get_invoice_status",
      "Express-Pay ERIP: invoice status (GET /v1/invoices/{InvoiceNo}/status)",
      invoiceNoInputSchema,
      async (args) => {
        try {
          const client = requireClient(config);
          const result = await client.getInvoiceStatus(args.invoice_no);
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.tool(
      "express_pay_erip_cancel_invoice",
      "Express-Pay ERIP: cancel pending invoice (DELETE /v1/invoices/{InvoiceNo})",
      invoiceNoInputSchema,
      async (args) => {
        try {
          assertWriteAllowed(config);
          const client = requireClient(config);
          const result = await client.cancelInvoice(args.invoice_no);
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );

    server.tool(
      "express_pay_epos_get_qrcode",
      "Express-Pay E-POS: QR for invoice (GET /v1/qrcode/getqrcode)",
      getQrCodeInputSchema,
      async (args) => {
        try {
          const client = requireClient(config);
          const result = await client.getQrCode({
            InvoiceId: args.invoice_id,
            ViewType: args.view_type ?? "base64",
            ImageWidth: args.image_width,
            ImageHeight: args.image_height,
          });
          return textResult(result);
        } catch (err) {
          return errorResult(err);
        }
      },
    );
  },
};
