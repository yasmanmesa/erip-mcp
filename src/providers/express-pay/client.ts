import {
  computeSignature,
  formatAmount,
  type SignatureOperation,
} from "./signature.js";

export class ExpressPayApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ExpressPayApiError";
    this.status = status;
    this.body = body;
  }
}

export type ExpressPayClientOptions = {
  token: string;
  secretWord?: string;
  apiBaseUrl: string;
  fetchImpl?: typeof fetch;
};

export type CreateInvoiceParams = {
  AccountNo: string;
  Amount: number | string;
  Currency?: number;
  Expiration?: string;
  Info?: string;
  Surname?: string;
  FirstName?: string;
  Patronymic?: string;
  City?: string;
  Street?: string;
  House?: string;
  Building?: string;
  Apartment?: string;
  IsNameEditable?: number;
  IsAddressEditable?: number;
  IsAmountEditable?: number;
  EmailNotification?: string;
  SmsPhone?: string;
  ReturnInvoiceUrl?: number;
  LifeTime?: number;
  InvoiceType?: number;
};

export class ExpressPayClient {
  private readonly token: string;
  private readonly secretWord: string | undefined;
  private readonly apiBaseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: ExpressPayClientOptions) {
    this.token = opts.token;
    this.secretWord = opts.secretWord;
    this.apiBaseUrl = opts.apiBaseUrl.replace(/\/$/, "");
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private sign(
    params: Record<string, string | number | undefined | null>,
    operation: SignatureOperation,
  ): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      if (v === "") continue;
      out[k] = String(v);
    }
    // Always include Token for signing / query
    out.Token = this.token;

    if (this.secretWord) {
      out.signature = computeSignature(out, this.secretWord, operation);
    }
    return out;
  }

  private async request(
    method: string,
    path: string,
    params: Record<string, string>,
    bodyAsForm: boolean,
  ): Promise<unknown> {
    const url = new URL(`${this.apiBaseUrl}${path}`);
    // token always in query per docs
    url.searchParams.set("token", this.token);
    if (params.signature) {
      url.searchParams.set("signature", params.signature);
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    let body: string | undefined;
    if (method === "GET" || method === "DELETE") {
      for (const [k, v] of Object.entries(params)) {
        if (k === "Token" || k === "signature") continue;
        if (v !== "") url.searchParams.set(k, v);
      }
    } else if (bodyAsForm) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      const form = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (k === "Token") continue; // already in query
        form.set(k, v);
      }
      body = form.toString();
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await this.fetchImpl(url.toString(), {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      const text = await res.text();
      let parsed: unknown = text;
      if (text) {
        try {
          parsed = JSON.parse(text) as unknown;
        } catch {
          parsed = text;
        }
      } else {
        parsed = null;
      }

      if (!res.ok) {
        const msg =
          typeof parsed === "object" &&
          parsed !== null &&
          "Error" in parsed &&
          typeof (parsed as { Error: { Msg?: string } }).Error?.Msg === "string"
            ? (parsed as { Error: { Msg: string } }).Error.Msg
            : `Express-Pay API error HTTP ${res.status}`;
        throw new ExpressPayApiError(msg, res.status, parsed);
      }

      // Some Express-Pay errors return HTTP 200 with Error node
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "Error" in parsed &&
        (parsed as { Error: unknown }).Error
      ) {
        const err = (parsed as { Error: { Msg?: string; Code?: number } }).Error;
        throw new ExpressPayApiError(
          err.Msg ?? "Express-Pay Error node",
          err.Code ?? 500,
          parsed,
        );
      }

      return parsed;
    } finally {
      clearTimeout(timeout);
    }
  }

  listInvoices(filters: {
    From?: string;
    To?: string;
    AccountNo?: string;
    Status?: number | string;
  } = {}): Promise<unknown> {
    const signed = this.sign(
      {
        Token: this.token,
        From: filters.From ?? "",
        To: filters.To ?? "",
        AccountNo: filters.AccountNo ?? "",
        Status: filters.Status ?? "",
      },
      "listInvoices",
    );
    return this.request("GET", "/invoices", signed, false);
  }

  createInvoice(input: CreateInvoiceParams): Promise<unknown> {
    const amount = formatAmount(input.Amount);
    const signed = this.sign(
      {
        Token: this.token,
        AccountNo: input.AccountNo,
        Amount: amount,
        Currency: input.Currency ?? 933,
        Expiration: input.Expiration ?? "",
        Info: input.Info ?? "",
        Surname: input.Surname ?? "",
        FirstName: input.FirstName ?? "",
        Patronymic: input.Patronymic ?? "",
        City: input.City ?? "",
        Street: input.Street ?? "",
        House: input.House ?? "",
        Building: input.Building ?? "",
        Apartment: input.Apartment ?? "",
        IsNameEditable: input.IsNameEditable ?? 0,
        IsAddressEditable: input.IsAddressEditable ?? 0,
        IsAmountEditable: input.IsAmountEditable ?? 0,
        EmailNotification: input.EmailNotification ?? "",
        ReturnInvoiceUrl: input.ReturnInvoiceUrl ?? 1,
        // Extra fields not in signature (sent if present)
        SmsPhone: input.SmsPhone,
        LifeTime: input.LifeTime,
        InvoiceType: input.InvoiceType,
      },
      "createInvoice",
    );
    return this.request("POST", "/invoices", signed, true);
  }

  getInvoice(
    invoiceNo: string | number,
    returnInvoiceUrl = 1,
  ): Promise<unknown> {
    const signed = this.sign(
      {
        Token: this.token,
        InvoiceNo: invoiceNo,
        ReturnInvoiceUrl: returnInvoiceUrl,
      },
      "getInvoice",
    );
    return this.request(
      "GET",
      `/invoices/${encodeURIComponent(String(invoiceNo))}`,
      signed,
      false,
    );
  }

  getInvoiceStatus(invoiceNo: string | number): Promise<unknown> {
    const signed = this.sign(
      {
        Token: this.token,
        InvoiceNo: invoiceNo,
      },
      "getInvoiceStatus",
    );
    return this.request(
      "GET",
      `/invoices/${encodeURIComponent(String(invoiceNo))}/status`,
      signed,
      false,
    );
  }

  cancelInvoice(invoiceNo: string | number): Promise<unknown> {
    const signed = this.sign(
      {
        Token: this.token,
        InvoiceNo: invoiceNo,
      },
      "cancelInvoice",
    );
    return this.request(
      "DELETE",
      `/invoices/${encodeURIComponent(String(invoiceNo))}`,
      signed,
      false,
    );
  }

  getQrCode(params: {
    InvoiceId: string | number;
    ViewType?: string;
    ImageWidth?: number;
    ImageHeight?: number;
  }): Promise<unknown> {
    const signed = this.sign(
      {
        Token: this.token,
        InvoiceId: params.InvoiceId,
        ViewType: params.ViewType ?? "base64",
        ImageWidth: params.ImageWidth ?? "",
        ImageHeight: params.ImageHeight ?? "",
      },
      "getQrCode",
    );
    return this.request("GET", "/qrcode/getqrcode", signed, false);
  }
}
