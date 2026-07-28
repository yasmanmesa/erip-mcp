import { describe, expect, it } from "vitest";
import {
  buildAssistCreateBill,
  buildAssistPaymentCheckout,
} from "./checkout.js";

describe("Assist checkout builders", () => {
  it("builds payment form fields", () => {
    const result = buildAssistPaymentCheckout({
      merchantId: "12345",
      paymentBaseUrl: "https://test.paysec.by",
      orderNumber: "ORD-1",
      orderAmount: 10.5,
      email: "a@b.c",
    });
    expect(result.action).toBe("https://test.paysec.by/pay/order.cfm");
    expect(result.method).toBe("POST");
    expect(result.fields.merchant_Id).toBe("12345");
    expect(result.fields.orderAmount).toBe("10.50");
    expect(result.fields.orderCurrency).toBe("BYN");
    expect(result.fields.email).toBe("a@b.c");
  });

  it("builds createbill fields", () => {
    const result = buildAssistCreateBill({
      merchantId: "12345",
      paymentBaseUrl: "https://test.paysec.by/",
      billNumber: "B-9",
      billAmount: "3.00",
    });
    expect(result.action).toBe("https://test.paysec.by/bill/createbill.cfm");
    expect(result.fields.Merchant_ID).toBe("12345");
    expect(result.fields.BillNumber).toBe("B-9");
  });
});
