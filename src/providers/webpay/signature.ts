import { createHash } from "node:crypto";

/**
 * WEBPAY order signature (wsb_version = 2 → SHA1).
 * Concatenate in order: seed + storeid + order_num + test + currency_id + total + SecretKey
 * @see https://docs.webpay.by/en/paymentIntegration/cardIntegration/orderSignature/
 */
export function computeWebpaySignature(params: {
  seed: string;
  storeId: string;
  orderNum: string;
  test: string | number;
  currencyId: string;
  total: string | number;
  secretKey: string;
}): string {
  const raw =
    String(params.seed) +
    String(params.storeId) +
    String(params.orderNum) +
    String(params.test) +
    String(params.currencyId) +
    String(params.total) +
    String(params.secretKey);
  return createHash("sha1").update(raw, "utf8").digest("hex");
}

export type WebpayCheckoutInput = {
  storeId: string;
  secretKey: string;
  orderNum: string;
  total: number | string;
  currencyId?: string;
  test?: 0 | 1;
  storeName?: string;
  seed?: string;
  returnUrl?: string;
  cancelReturnUrl?: string;
  notifyUrl?: string;
  dueDateUnix?: number;
  tab?: "erip" | string;
  items?: Array<{ name: string; quantity: number; price: number | string }>;
  paymentBaseUrl: string;
};

export function buildWebpayEripCheckout(input: WebpayCheckoutInput): {
  action: string;
  method: "POST";
  fields: Record<string, string>;
  signature: string;
} {
  const seed = input.seed ?? String(Math.floor(Date.now() / 1000));
  const test = input.test ?? 1;
  const currencyId = input.currencyId ?? "BYN";
  const total =
    typeof input.total === "number" ? input.total.toFixed(2) : String(input.total);

  const signature = computeWebpaySignature({
    seed,
    storeId: input.storeId,
    orderNum: input.orderNum,
    test,
    currencyId,
    total,
    secretKey: input.secretKey,
  });

  const fields: Record<string, string> = {
    "*scart": "",
    wsb_version: "2",
    wsb_language_id: "russian",
    wsb_storeid: input.storeId,
    wsb_order_num: input.orderNum,
    wsb_test: String(test),
    wsb_currency_id: currencyId,
    wsb_seed: seed,
    wsb_total: total,
    wsb_signature: signature,
    wsb_tab: input.tab ?? "erip",
  };

  if (input.storeName) fields.wsb_store = input.storeName;
  if (input.returnUrl) fields.wsb_return_url = input.returnUrl;
  if (input.cancelReturnUrl) fields.wsb_cancel_return_url = input.cancelReturnUrl;
  if (input.notifyUrl) fields.wsb_notify_url = input.notifyUrl;
  if (input.dueDateUnix !== undefined) {
    fields.wsb_due_date = String(input.dueDateUnix);
  }

  const items = input.items?.length
    ? input.items
    : [{ name: "Order", quantity: 1, price: total }];

  items.forEach((item, i) => {
    fields[`wsb_invoice_item_name[${i}]`] = item.name;
    fields[`wsb_invoice_item_quantity[${i}]`] = String(item.quantity);
    fields[`wsb_invoice_item_price[${i}]`] = String(item.price);
  });

  return {
    action: input.paymentBaseUrl,
    method: "POST",
    fields,
    signature,
  };
}
