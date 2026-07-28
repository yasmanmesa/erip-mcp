import { describe, expect, it, vi } from "vitest";
import { BePaidApiError, BePaidClient } from "./client.js";

type FetchMock = ReturnType<
  typeof vi.fn<
    (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => Promise<Response>
  >
>;

function createFetchMock(
  impl: () => Promise<Response>,
): FetchMock {
  return vi.fn<
    (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => Promise<Response>
  >(impl);
}

describe("BePaidClient", () => {
  it("POSTs ERIP payment with Basic auth", async () => {
    const fetchImpl = createFetchMock(async () => {
      return new Response(JSON.stringify({ transaction: { uid: "abc" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const client = new BePaidClient({
      shopId: "shop",
      secretKey: "secret",
      apiBaseUrl: "https://api.bepaid.by",
      fetchImpl,
    });

    const result = await client.createEripPayment({
      request: { amount: 1000, currency: "BYN" },
    });

    expect(result).toEqual({ transaction: { uid: "abc" } });
    expect(fetchImpl).toHaveBeenCalledOnce();

    const call = fetchImpl.mock.calls[0];
    expect(call).toBeDefined();
    const [url, init] = call!;
    expect(url).toBe("https://api.bepaid.by/beyag/payments");
    expect(init?.method).toBe("POST");

    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^Basic /);
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("GETs by uid and order_id", async () => {
    const fetchImpl = createFetchMock(
      async () => new Response("{}", { status: 200 }),
    );
    const client = new BePaidClient({
      shopId: "s",
      secretKey: "k",
      apiBaseUrl: "https://api.bepaid.by/",
      fetchImpl,
    });

    await client.getEripPaymentByUid("uid-1");
    await client.getEripPaymentByOrderId("ord-9");

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://api.bepaid.by/beyag/payments/uid-1",
    );
    expect(String(fetchImpl.mock.calls[1]?.[0])).toContain("order_id=ord-9");
  });

  it("POSTs KROK payment to transactions/payments", async () => {
    const fetchImpl = createFetchMock(async () => {
      return new Response(JSON.stringify({ transaction: { uid: "k1" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    const client = new BePaidClient({
      shopId: "shop",
      secretKey: "secret",
      apiBaseUrl: "https://api.bepaid.by",
      fetchImpl,
    });

    await client.createKrokPayment({
      request: { amount: 1500, currency: "BYN", method: { type: "krok" } },
    });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://api.bepaid.by/beyag/transactions/payments",
    );

    await client.getTransactionByUid("k1");
    expect(fetchImpl.mock.calls[1]?.[0]).toBe(
      "https://api.bepaid.by/beyag/transactions/k1",
    );
  });

  it("throws BePaidApiError on non-2xx", async () => {
    const fetchImpl = createFetchMock(
      async () =>
        new Response(JSON.stringify({ message: "boom" }), { status: 422 }),
    );
    const client = new BePaidClient({
      shopId: "s",
      secretKey: "k",
      apiBaseUrl: "https://api.bepaid.by",
      fetchImpl,
    });

    await expect(client.deleteEripPayment("x")).rejects.toBeInstanceOf(
      BePaidApiError,
    );
  });
});
