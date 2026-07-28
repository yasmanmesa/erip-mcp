export type AssistCheckoutInput = {
  merchantId: string;
  orderNumber: string;
  orderAmount: number | string;
  orderCurrency?: string;
  orderComment?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  urlReturnOk?: string;
  urlReturnNo?: string;
  language?: string;
  paymentBaseUrl: string;
};

/**
 * Assist (Belarus): build hosted payment form fields.
 * Test host: https://test.paysec.by/pay/order.cfm
 * @see https://docs.belassist.by/display/BEE/Payment+request
 */
export function buildAssistPaymentCheckout(input: AssistCheckoutInput): {
  action: string;
  method: "POST";
  fields: Record<string, string>;
} {
  const fields: Record<string, string> = {
    merchant_Id: input.merchantId,
    orderNumber: input.orderNumber,
    orderAmount:
      typeof input.orderAmount === "number"
        ? input.orderAmount.toFixed(2)
        : String(input.orderAmount),
    orderCurrency: input.orderCurrency ?? "BYN",
    language: input.language ?? "RU",
    cardPayment: "1",
  };

  if (input.orderComment) fields.orderComment = input.orderComment;
  if (input.email) fields.email = input.email;
  if (input.firstName) fields.firstName = input.firstName;
  if (input.lastName) fields.lastName = input.lastName;
  if (input.urlReturnOk) fields.url_Return_Ok = input.urlReturnOk;
  if (input.urlReturnNo) fields.url_Return_No = input.urlReturnNo;

  return {
    action: `${input.paymentBaseUrl.replace(/\/$/, "")}/pay/order.cfm`,
    method: "POST",
    fields,
  };
}

export type AssistBillInput = {
  merchantId: string;
  billNumber: string;
  billAmount: number | string;
  billCurrency?: string;
  billComment?: string;
  customerEmail?: string;
  paymentBaseUrl: string;
};

/** Assist createbill form fields (link/invoice style). */
export function buildAssistCreateBill(input: AssistBillInput): {
  action: string;
  method: "POST";
  fields: Record<string, string>;
} {
  const fields: Record<string, string> = {
    Merchant_ID: input.merchantId,
    BillNumber: input.billNumber,
    BillAmount:
      typeof input.billAmount === "number"
        ? input.billAmount.toFixed(2)
        : String(input.billAmount),
    BillCurrency: input.billCurrency ?? "BYN",
  };
  if (input.billComment) fields.BillComment = input.billComment;
  if (input.customerEmail) fields.CustomerEmail = input.customerEmail;

  return {
    action: `${input.paymentBaseUrl.replace(/\/$/, "")}/bill/createbill.cfm`,
    method: "POST",
    fields,
  };
}
