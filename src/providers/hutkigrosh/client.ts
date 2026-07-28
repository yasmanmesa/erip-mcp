export class HutkiApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "HutkiApiError";
    this.status = status;
    this.body = body;
  }
}

export type HutkiClientOptions = {
  username: string;
  password: string;
  apiBaseUrl: string;
  fetchImpl?: typeof fetch;
};

export type HutkiBill = {
  eripId: number;
  invId: string;
  amt: number;
  curr?: string;
  fullName?: string;
  mobilePhone?: string;
  notifyByMobilePhone?: boolean;
  email?: string;
  notifyByEMail?: boolean;
  fullAddress?: string;
  info?: string;
  products?: Array<{
    invItemId?: string;
    desc: string;
    count: number;
    amt: number;
  }>;
};

/**
 * Hutki Grosh REST client (cookie session after LogIn).
 * @see https://hutkigrosh.by/files/API-servisa-Hutki-Grosh.ru_.pdf
 */
export class HutkiClient {
  private readonly username: string;
  private readonly password: string;
  private readonly apiBaseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private cookieHeader = "";

  constructor(opts: HutkiClientOptions) {
    this.username = opts.username;
    this.password = opts.password;
    this.apiBaseUrl = opts.apiBaseUrl.replace(/\/$/, "");
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private storeCookies(res: Response): void {
    // Node fetch may expose getSetCookie()
    const anyHeaders = res.headers as Headers & { getSetCookie?: () => string[] };
    const setCookies =
      typeof anyHeaders.getSetCookie === "function"
        ? anyHeaders.getSetCookie()
        : [];
    if (setCookies.length) {
      this.cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");
      return;
    }
    const single = res.headers.get("set-cookie");
    if (single) {
      this.cookieHeader = single.split(",").map((c) => c.split(";")[0].trim()).join("; ");
    }
  }

  private async request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (this.cookieHeader) headers.Cookie = this.cookieHeader;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await this.fetchImpl(`${this.apiBaseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      this.storeCookies(res);

      const text = await res.text();
      let parsed: unknown = text;
      if (text) {
        try {
          parsed = JSON.parse(text) as unknown;
        } catch {
          parsed = text;
        }
      }

      if (!res.ok) {
        throw new HutkiApiError(
          `Hutki Grosh HTTP ${res.status}`,
          res.status,
          parsed,
        );
      }
      return parsed;
    } finally {
      clearTimeout(timeout);
    }
  }

  async logIn(): Promise<unknown> {
    return this.request("POST", "/Security/LogIn", {
      user: this.username,
      pwd: this.password,
    });
  }

  async logOut(): Promise<unknown> {
    return this.request("POST", "/Security/LogOut");
  }

  async createBill(bill: HutkiBill): Promise<unknown> {
    return this.request("POST", "/Invoicing/Bill", bill);
  }

  async getBill(billId: string | number): Promise<unknown> {
    return this.request("GET", `/Invoicing/Bill(${billId})`);
  }

  async deleteBill(billId: string | number): Promise<unknown> {
    return this.request("DELETE", `/Invoicing/Bill(${billId})`);
  }

  async getBillStatus(billId: string | number): Promise<unknown> {
    return this.request("GET", `/Invoicing/BillStatus(${billId})`);
  }

  async listBills(
    start = 0,
    count = 30,
    sortType = 1,
  ): Promise<unknown> {
    return this.request(
      "GET",
      `/Invoicing/Bills(${start},${count},${sortType})`,
    );
  }

  async getBillQrCode(
    billId: string | number,
    resultType = 0,
    width = 174,
    height = 386,
  ): Promise<unknown> {
    return this.request(
      "GET",
      `/Invoicing/BillQRCode(${billId},${resultType},${width},${height})`,
    );
  }
}
