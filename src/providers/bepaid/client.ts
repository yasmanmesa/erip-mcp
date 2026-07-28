export class BePaidApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "BePaidApiError";
    this.status = status;
    this.body = body;
  }
}

export type BePaidClientOptions = {
  shopId: string;
  secretKey: string;
  apiBaseUrl: string;
  /** Injected for tests. */
  fetchImpl?: typeof fetch;
};

export class BePaidClient {
  private readonly shopId: string;
  private readonly secretKey: string;
  private readonly apiBaseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: BePaidClientOptions) {
    this.shopId = opts.shopId;
    this.secretKey = opts.secretKey;
    this.apiBaseUrl = opts.apiBaseUrl.replace(/\/$/, "");
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private authHeader(): string {
    const token = Buffer.from(`${this.shopId}:${this.secretKey}`).toString(
      "base64",
    );
    return `Basic ${token}`;
  }

  async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.apiBaseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: this.authHeader(),
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await this.fetchImpl(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
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
          "message" in parsed &&
          typeof (parsed as { message: unknown }).message === "string"
            ? (parsed as { message: string }).message
            : `bePaid API error HTTP ${res.status}`;
        throw new BePaidApiError(msg, res.status, parsed);
      }

      return parsed as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  createEripPayment(requestBody: unknown): Promise<unknown> {
    return this.request("POST", "/beyag/payments", requestBody);
  }

  createKrokPayment(requestBody: unknown): Promise<unknown> {
    return this.request("POST", "/beyag/transactions/payments", requestBody);
  }

  getTransactionByUid(uid: string): Promise<unknown> {
    return this.request(
      "GET",
      `/beyag/transactions/${encodeURIComponent(uid)}`,
    );
  }

  getEripPaymentByUid(uid: string): Promise<unknown> {
    return this.request(
      "GET",
      `/beyag/payments/${encodeURIComponent(uid)}`,
    );
  }

  getEripPaymentByOrderId(orderId: string): Promise<unknown> {
    const q = new URLSearchParams({ order_id: orderId });
    return this.request("GET", `/beyag/payments/?${q.toString()}`);
  }

  deleteEripPayment(uid: string): Promise<unknown> {
    return this.request(
      "DELETE",
      `/beyag/payments/${encodeURIComponent(uid)}`,
    );
  }
}
