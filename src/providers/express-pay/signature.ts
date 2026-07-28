import { createHmac } from "node:crypto";

/**
 * Express-Pay HMAC-SHA1 signatures use a fixed field order per operation.
 * Values are concatenated (missing → empty), then HMAC-SHA1 uppercased.
 * @see https://express-pay.by/docs/api/v1
 */
export const SIGNATURE_FIELDS = {
  listInvoices: ["token", "from", "to", "accountno", "status"],
  createInvoice: [
    "token",
    "accountno",
    "amount",
    "currency",
    "expiration",
    "info",
    "surname",
    "firstname",
    "patronymic",
    "city",
    "street",
    "house",
    "building",
    "apartment",
    "isnameeditable",
    "isaddresseditable",
    "isamounteditable",
    "emailnotification",
    "returninvoiceurl",
  ],
  getInvoice: ["token", "invoiceno", "returninvoiceurl"],
  getInvoiceStatus: ["token", "invoiceno"],
  cancelInvoice: ["token", "invoiceno"],
  getQrCode: ["token", "invoiceid", "viewtype", "imagewidth", "imageheight"],
} as const;

export type SignatureOperation = keyof typeof SIGNATURE_FIELDS;

export function computeSignature(
  params: Record<string, string | number | undefined | null>,
  secretWord: string,
  operation: SignatureOperation,
): string {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    normalized[key.toLowerCase()] =
      value === undefined || value === null ? "" : String(value);
  }

  let payload = "";
  for (const field of SIGNATURE_FIELDS[operation]) {
    payload += normalized[field] ?? "";
  }

  return createHmac("sha1", secretWord).update(payload, "utf8").digest("hex").toUpperCase();
}

/** Format amount for Express-Pay (comma as decimal separator). */
export function formatAmount(amount: number | string): string {
  if (typeof amount === "string") {
    return amount.includes(",") ? amount : amount.replace(".", ",");
  }
  return amount.toFixed(2).replace(".", ",");
}
