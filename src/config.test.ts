import { describe, expect, it } from "vitest";
import { assertWriteAllowed, ConfigError, loadConfig } from "./config.js";

const emptyProviders = {
  bepaid: null,
  expressPay: null,
  webpay: null,
  hutkigrosh: null,
  assist: null,
} as const;

describe("loadConfig", () => {
  it("defaults to sandbox docs-only mode", () => {
    const cfg = loadConfig({});
    expect(cfg.env).toBe("sandbox");
    expect(cfg.bepaid).toBeNull();
    expect(cfg.expressPay).toBeNull();
    expect(cfg.webpay).toBeNull();
    expect(cfg.hutkigrosh).toBeNull();
    expect(cfg.assist).toBeNull();
    expect(cfg.allowWrite).toBe(false);
  });

  it("loads bePaid credentials", () => {
    const cfg = loadConfig({
      BEPAID_SHOP_ID: "shop1",
      BEPAID_SECRET_KEY: "secret1",
    });
    expect(cfg.bepaid).toEqual({
      shopId: "shop1",
      secretKey: "secret1",
      apiBaseUrl: "https://api.bepaid.by",
    });
  });

  it("loads Express-Pay sandbox credentials", () => {
    const cfg = loadConfig({
      EXPRESS_PAY_TOKEN: "tok",
      EXPRESS_PAY_SECRET_WORD: "sandbox.expresspay.by",
    });
    expect(cfg.expressPay).toEqual({
      token: "tok",
      secretWord: "sandbox.expresspay.by",
      apiBaseUrl: "https://sandbox-api.express-pay.by/v1",
    });
  });

  it("loads WEBPAY sandbox defaults", () => {
    const cfg = loadConfig({
      WEBPAY_STORE_ID: "123",
      WEBPAY_SECRET_KEY: "sek",
    });
    expect(cfg.webpay).toEqual({
      storeId: "123",
      secretKey: "sek",
      paymentBaseUrl: "https://securesandbox.webpay.by/",
    });
  });

  it("loads Hutki Grosh credentials", () => {
    const cfg = loadConfig({
      HUTKIGROSH_USER: "u",
      HUTKIGROSH_PASSWORD: "p",
    });
    expect(cfg.hutkigrosh).toEqual({
      username: "u",
      password: "p",
      apiBaseUrl: "https://www.hutkigrosh.by/API/v1",
    });
  });

  it("loads Assist sandbox defaults", () => {
    const cfg = loadConfig({ ASSIST_MERCHANT_ID: "m1" });
    expect(cfg.assist).toEqual({
      merchantId: "m1",
      paymentBaseUrl: "https://test.paysec.by",
    });
  });

  it("rejects partial credentials", () => {
    expect(() => loadConfig({ BEPAID_SHOP_ID: "only-shop" })).toThrow(
      ConfigError,
    );
    expect(() => loadConfig({ WEBPAY_STORE_ID: "only" })).toThrow(ConfigError);
  });

  it("parses production + allow write", () => {
    const cfg = loadConfig({
      ERIP_MCP_ENV: "production",
      ERIP_MCP_ALLOW_WRITE: "1",
      BEPAID_SHOP_ID: "s",
      BEPAID_SECRET_KEY: "k",
    });
    expect(cfg.env).toBe("production");
    expect(cfg.allowWrite).toBe(true);
  });
});

describe("assertWriteAllowed", () => {
  it("allows sandbox writes without flag", () => {
    expect(() =>
      assertWriteAllowed({
        env: "sandbox",
        allowWrite: false,
        ...emptyProviders,
      }),
    ).not.toThrow();
  });

  it("blocks production writes without flag", () => {
    expect(() =>
      assertWriteAllowed({
        env: "production",
        allowWrite: false,
        ...emptyProviders,
      }),
    ).toThrow(/ERIP_MCP_ALLOW_WRITE/);
  });
});
