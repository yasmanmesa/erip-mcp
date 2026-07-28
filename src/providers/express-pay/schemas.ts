import { z } from "zod";

export const listInvoicesInputSchema = {
  from: z
    .string()
    .optional()
    .describe("Start date yyyyMMdd"),
  to: z.string().optional().describe("End date yyyyMMdd"),
  account_no: z.string().optional().describe("Account / bill number"),
  status: z
    .number()
    .int()
    .optional()
    .describe(
      "1 pending, 2 expired, 3 paid, 4 partial, 5 canceled, 6 card paid, 7 refunded",
    ),
};

export const createInvoiceInputSchema = {
  account_no: z.string().describe("ERIP / E-POS account number (лицевой счёт)"),
  amount: z
    .number()
    .positive()
    .describe("Amount in major units (e.g. 10.5 BYN). Sent as 10,50"),
  currency: z
    .number()
    .int()
    .default(933)
    .describe("Currency code: 933=BYN, 978=EUR, 840=USD"),
  info: z.string().optional().describe("Payment purpose / description"),
  expiration: z
    .string()
    .optional()
    .describe("Expiry yyyyMMdd or yyyyMMddHHmm"),
  lifetime_seconds: z.number().int().positive().optional(),
  invoice_type: z
    .number()
    .int()
    .optional()
    .describe("1 = one-time, 2 = permanent"),
  return_invoice_url: z
    .number()
    .int()
    .min(0)
    .max(1)
    .default(1)
    .describe("1 = include public invoice URL in response"),
  surname: z.string().optional(),
  first_name: z.string().optional(),
  patronymic: z.string().optional(),
  city: z.string().optional(),
  street: z.string().optional(),
  house: z.string().optional(),
  building: z.string().optional(),
  apartment: z.string().optional(),
  email_notification: z.string().email().optional(),
  sms_phone: z.string().optional(),
  is_name_editable: z.number().int().min(0).max(1).optional(),
  is_address_editable: z.number().int().min(0).max(1).optional(),
  is_amount_editable: z.number().int().min(0).max(1).optional(),
};

export const invoiceNoInputSchema = {
  invoice_no: z
    .union([z.string(), z.number()])
    .describe("Express-Pay invoice number (InvoiceNo)"),
};

export const getInvoiceInputSchema = {
  ...invoiceNoInputSchema,
  return_invoice_url: z.number().int().min(0).max(1).default(1).optional(),
};

export const getQrCodeInputSchema = {
  invoice_id: z
    .union([z.string(), z.number()])
    .describe("Invoice id for QR generation"),
  view_type: z
    .string()
    .default("base64")
    .describe("QR response type, typically base64"),
  image_width: z.number().int().optional(),
  image_height: z.number().int().optional(),
};
