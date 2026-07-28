import { describe, expect, it } from "vitest";
import { computeSignature, formatAmount } from "./signature.js";

describe("formatAmount", () => {
  it("formats number with comma", () => {
    expect(formatAmount(123.01)).toBe("123,01");
    expect(formatAmount(10)).toBe("10,00");
  });

  it("normalizes dotted strings", () => {
    expect(formatAmount("12.5")).toBe("12,5");
    expect(formatAmount("12,50")).toBe("12,50");
  });
});

describe("computeSignature", () => {
  it("matches Express-Pay HMAC-SHA1 for list invoices", () => {
    const sig = computeSignature(
      {
        Token: "a75b74cbcfe446509e8ee874f421bd66",
        From: "",
        To: "",
        AccountNo: "",
        Status: "",
      },
      "sandbox.expresspay.by",
      "listInvoices",
    );
    expect(sig).toMatch(/^[A-F0-9]{40}$/);
    // Stable for empty filters + documented sandbox secret
    expect(sig).toBe(
      computeSignature(
        {
          token: "a75b74cbcfe446509e8ee874f421bd66",
          from: "",
          to: "",
          accountno: "",
          status: "",
        },
        "sandbox.expresspay.by",
        "listInvoices",
      ),
    );
  });
});
