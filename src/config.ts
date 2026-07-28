import { z } from "zod";

const envSchema = z.object({
  BEPAID_SHOP_ID: z.string().min(1).optional(),
  BEPAID_SECRET_KEY: z.string().min(1).optional(),
  BEPAID_API_BASE_URL: z.string().url().optional(),
  EXPRESS_PAY_TOKEN: z.string().min(1).optional(),
  EXPRESS_PAY_SECRET_WORD: z.string().optional(),
  EXPRESS_PAY_API_BASE_URL: z.string().url().optional(),
  WEBPAY_STORE_ID: z.string().min(1).optional(),
  WEBPAY_SECRET_KEY: z.string().min(1).optional(),
  WEBPAY_PAYMENT_BASE_URL: z.string().url().optional(),
  HUTKIGROSH_USER: z.string().min(1).optional(),
  HUTKIGROSH_PASSWORD: z.string().min(1).optional(),
  HUTKIGROSH_API_BASE_URL: z.string().url().optional(),
  ASSIST_MERCHANT_ID: z.string().min(1).optional(),
  ASSIST_PAYMENT_BASE_URL: z.string().url().optional(),
  ERIP_MCP_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  ERIP_MCP_ALLOW_WRITE: z
    .string()
    .optional()
    .transform((v) => v === "1" || v?.toLowerCase() === "true"),
});

export type AppConfig = {
  env: "sandbox" | "production";
  allowWrite: boolean;
  bepaid: {
    shopId: string;
    secretKey: string;
    apiBaseUrl: string;
  } | null;
  expressPay: {
    token: string;
    secretWord?: string;
    apiBaseUrl: string;
  } | null;
  webpay: {
    storeId: string;
    secretKey: string;
    paymentBaseUrl: string;
  } | null;
  hutkigrosh: {
    username: string;
    password: string;
    apiBaseUrl: string;
  } | null;
  assist: {
    merchantId: string;
    paymentBaseUrl: string;
  } | null;
};

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

function requirePair(
  a: string | undefined,
  b: string | undefined,
  label: string,
): void {
  if (Boolean(a) !== Boolean(b)) {
    throw new ConfigError(
      `Set both ${label}, or neither (docs-only / other providers).`,
    );
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new ConfigError(`Invalid environment: ${details}`);
  }

  const data = parsed.data;
  requirePair(data.BEPAID_SHOP_ID, data.BEPAID_SECRET_KEY, "BEPAID_SHOP_ID and BEPAID_SECRET_KEY");
  requirePair(data.WEBPAY_STORE_ID, data.WEBPAY_SECRET_KEY, "WEBPAY_STORE_ID and WEBPAY_SECRET_KEY");
  requirePair(
    data.HUTKIGROSH_USER,
    data.HUTKIGROSH_PASSWORD,
    "HUTKIGROSH_USER and HUTKIGROSH_PASSWORD",
  );

  const bepaid =
    data.BEPAID_SHOP_ID && data.BEPAID_SECRET_KEY
      ? {
          shopId: data.BEPAID_SHOP_ID,
          secretKey: data.BEPAID_SECRET_KEY,
          apiBaseUrl: (
            data.BEPAID_API_BASE_URL ?? "https://api.bepaid.by"
          ).replace(/\/$/, ""),
        }
      : null;

  const defaultExpressBase =
    data.ERIP_MCP_ENV === "production"
      ? "https://api.express-pay.by/v1"
      : "https://sandbox-api.express-pay.by/v1";

  const expressPay = data.EXPRESS_PAY_TOKEN
    ? {
        token: data.EXPRESS_PAY_TOKEN,
        secretWord: data.EXPRESS_PAY_SECRET_WORD,
        apiBaseUrl: (
          data.EXPRESS_PAY_API_BASE_URL ?? defaultExpressBase
        ).replace(/\/$/, ""),
      }
    : null;

  const defaultWebpayBase =
    data.ERIP_MCP_ENV === "production"
      ? "https://payment.webpay.by/"
      : "https://securesandbox.webpay.by/";

  const webpay =
    data.WEBPAY_STORE_ID && data.WEBPAY_SECRET_KEY
      ? {
          storeId: data.WEBPAY_STORE_ID,
          secretKey: data.WEBPAY_SECRET_KEY,
          paymentBaseUrl: (
            data.WEBPAY_PAYMENT_BASE_URL ?? defaultWebpayBase
          ).replace(/\/?$/, "/"),
        }
      : null;

  const hutkigrosh =
    data.HUTKIGROSH_USER && data.HUTKIGROSH_PASSWORD
      ? {
          username: data.HUTKIGROSH_USER,
          password: data.HUTKIGROSH_PASSWORD,
          apiBaseUrl: (
            data.HUTKIGROSH_API_BASE_URL ?? "https://www.hutkigrosh.by/API/v1"
          ).replace(/\/$/, ""),
        }
      : null;

  const defaultAssistBase =
    data.ERIP_MCP_ENV === "production"
      ? "https://paysec.by"
      : "https://test.paysec.by";

  const assist = data.ASSIST_MERCHANT_ID
    ? {
        merchantId: data.ASSIST_MERCHANT_ID,
        paymentBaseUrl: (
          data.ASSIST_PAYMENT_BASE_URL ?? defaultAssistBase
        ).replace(/\/$/, ""),
      }
    : null;

  return {
    env: data.ERIP_MCP_ENV,
    allowWrite: Boolean(data.ERIP_MCP_ALLOW_WRITE),
    bepaid,
    expressPay,
    webpay,
    hutkigrosh,
    assist,
  };
}

/** Write tools are blocked in production unless ERIP_MCP_ALLOW_WRITE=1. */
export function assertWriteAllowed(config: AppConfig): void {
  if (config.env === "production" && !config.allowWrite) {
    throw new ConfigError(
      "Write tools are disabled in production. Set ERIP_MCP_ALLOW_WRITE=1 to enable.",
    );
  }
}
