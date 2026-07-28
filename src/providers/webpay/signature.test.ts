import { describe, expect, it } from "vitest";
import { computeWebpaySignature } from "./signature.js";

describe("computeWebpaySignature", () => {
  it("matches documented SHA1 example (version 2)", () => {
    // https://docs.webpay.by/en/paymentIntegration/cardIntegration/orderSignature/
    const sig = computeWebpaySignature({
      seed: "1242649174",
      storeId: "11111111",
      orderNum: "ORDER-12345678",
      test: 1,
      currencyId: "BYN",
      total: "21.90",
      secretKey: "12345678901234567890",
    });
    expect(sig).toBe("338d1647833079f9353907ad266ec0bb5264c0d9");
  });
});
