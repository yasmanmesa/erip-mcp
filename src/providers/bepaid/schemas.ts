import { z } from "zod";

export const customerSchema = z
  .object({
    first_name: z.string().max(30).optional(),
    middle_name: z.string().max(30).optional(),
    last_name: z.string().max(30).optional(),
    country: z.string().length(2).optional(),
    city: z.string().max(60).optional(),
    zip: z.string().max(20).optional(),
    address: z.string().max(250).optional(),
    phone: z.string().max(30).optional(),
  })
  .optional();

export const eripDeviceSchema = z.object({
  name: z.string(),
  item_unit: z.string(),
  rank: z.string(),
  value: z.string(),
  rate: z.string(),
});

export const createPaymentInputSchema = {
  amount: z
    .number()
    .int()
    .nonnegative()
    .describe("Amount in minor currency units (e.g. 1000 = 10.00 BYN)"),
  currency: z
    .string()
    .default("BYN")
    .describe("ISO currency code. ERIP is typically BYN."),
  description: z.string().describe("Payment description"),
  account_number: z
    .string()
    .describe("ERIP bill / order / agreement ID (account_number)"),
  service_no: z
    .string()
    .describe("ERIP service number assigned by bePaid / ERIP"),
  order_id: z
    .union([z.string(), z.number()])
    .optional()
    .describe("Merchant order id"),
  tracking_id: z.string().optional(),
  email: z.string().email().optional(),
  ip: z.string().optional(),
  notification_url: z.string().url().optional(),
  expired_at: z
    .string()
    .optional()
    .describe("ISO datetime when the payment request expires"),
  permanent: z
    .boolean()
    .optional()
    .describe("If true, creates a permanent (multi-pay) ERIP request"),
  customer: customerSchema,
  service_info: z.array(z.string()).optional(),
  receipt: z.array(z.string()).optional(),
  notifications: z
    .array(z.enum(["sms", "email"]))
    .optional()
    .describe("Customer notifications when the request is created"),
  receipt_text: z.array(z.string()).optional(),
  erip_devices: z.array(eripDeviceSchema).optional(),
  test: z
    .boolean()
    .optional()
    .describe("Force test flag on the request when supported by the shop"),
};

export const getPaymentInputSchema = {
  uid: z
    .string()
    .optional()
    .describe("Payment UID from bePaid (preferred)"),
  order_id: z
    .string()
    .optional()
    .describe("Merchant order_id (alternative to uid)"),
};

export const deletePaymentInputSchema = {
  uid: z.string().describe("Payment UID to delete (pending or permanent only)"),
};

export const createKrokPaymentInputSchema = {
  amount: z
    .number()
    .int()
    .positive()
    .describe("Amount in minor currency units (e.g. 1500 = 15.00 BYN)"),
  currency: z.string().default("BYN").optional(),
  description: z.string().describe("Payment description"),
  tracking_id: z.string().optional(),
  email: z.string().email().optional(),
  ip: z.string().optional(),
  language: z.string().optional(),
  notification_url: z.string().url().optional(),
  return_url: z.string().url().optional(),
  expired_at: z
    .string()
    .optional()
    .describe("ISO datetime when the KROK payment expires"),
  service_info: z
    .array(z.string())
    .optional()
    .describe("Order lines shown to the customer before paying via KROK"),
  test: z
    .boolean()
    .optional()
    .describe("Force test flag when supported by the shop"),
};

export const getTransactionInputSchema = {
  uid: z.string().describe("Transaction UID from bePaid"),
};
