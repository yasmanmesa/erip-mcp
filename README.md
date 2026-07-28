# erip-mcp

MCP server for **Belarus ERIP / E-POS / KROK** payments via aggregator APIs.  
Tools are **platform-specific** (`bepaid_erip_*`, `express_pay_*`, `webpay_*`, …) — not a generic payment facade.

> **Disclaimer:** This software is **not** a payment service provider, **not** affiliated with ОАО «НКФО «ЕРИП», and is **not** an official ERIP API. You need a merchant contract with an aggregator where required. See [docs/legal-research-belarus.md](docs/legal-research-belarus.md) (not legal advice).

## Status: what is ready vs not

| Area | Status | Notes |
|------|--------|--------|
| **Express-Pay** ERIP/E-POS tools | **Ready (verified)** | Live e2e against public sandbox (`sandbox-api.express-pay.by`) — list / create / get / status / cancel |
| **Express-Pay** QR tool | Implemented, **not** in e2e yet | Code path exists; not covered by the live test suite |
| **bePaid** ERIP tools | Implemented, **unverified live** | Unit tests with mocked HTTP only. Needs a real shop with ERIP enabled |
| **bePaid** KROK tools | Implemented, **unverified live** | Needs shop registered for KROK |
| **WEBPAY** ERIP checkout builder | Implemented, **unverified live** | Builds signed form; needs merchant `storeid`/`secret` |
| **Hutki Grosh** ERIP bills | Implemented, **unverified live** | Cookie session API; no public sandbox |
| **Assist** checkout builders | Implemented, **unverified live** | Form fields for `test.paysec.by` / `paysec.by` |
| MCP stdio + docs resources | **Ready** | Works without credentials (docs-only mode) |
| Production / live money | **Use at your own risk** | Default is sandbox; production writes need `ERIP_MCP_ALLOW_WRITE=1` |
| Official НКФО ERIP protocol | **Out of scope** | NDA / dedicated channel |

**Practical recommendation:** start with **Express-Pay** to try the MCP. Treat other providers as experimental until verified against your merchant account.

Run verified Express-Pay e2e:

```bash
ERIP_MCP_LIVE=1 npm test -- src/providers/express-pay/e2e.test.ts
```

## vs bepaid-mcp

| Package | Focus |
|---------|--------|
| **erip-mcp** (this) | ERIP / E-POS / KROK via aggregators (Express-Pay verified; others untested live) |
| [bepaid-mcp](https://github.com/theYahia/bepaid-mcp) | bePaid **cards** (capture, void, refund, tokenize, subscriptions) |

## Install / run

```bash
npx -y erip-mcp
```

Or from source:

```bash
npm install
npm run build
node dist/index.js
```

## Cursor / Claude Desktop

**Recommended (Express-Pay public sandbox):**

```json
{
  "mcpServers": {
    "erip": {
      "command": "npx",
      "args": ["-y", "erip-mcp"],
      "env": {
        "EXPRESS_PAY_TOKEN": "a75b74cbcfe446509e8ee874f421bd66",
        "EXPRESS_PAY_SECRET_WORD": "sandbox.expresspay.by",
        "ERIP_MCP_ENV": "sandbox"
      }
    }
  }
}
```

**bePaid (unverified — needs your shop credentials + ERIP/KROK enabled):**

```json
{
  "mcpServers": {
    "erip": {
      "command": "npx",
      "args": ["-y", "erip-mcp"],
      "env": {
        "BEPAID_SHOP_ID": "YOUR_SHOP_ID",
        "BEPAID_SECRET_KEY": "YOUR_SECRET_KEY",
        "ERIP_MCP_ENV": "sandbox"
      }
    }
  }
}
```

You can enable several providers at once; tools register per present credentials.  
See also [examples/cursor-mcp.json](examples/cursor-mcp.json).

Without credentials the server still exposes **documentation resources** (`erip://docs/...`).

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPRESS_PAY_TOKEN` | for Express-Pay tools | API token |
| `EXPRESS_PAY_SECRET_WORD` | if signatures required | HMAC secret (sandbox: `sandbox.expresspay.by`) |
| `EXPRESS_PAY_API_BASE_URL` | no | Defaults from `ERIP_MCP_ENV` |
| `BEPAID_SHOP_ID` | for bePaid tools | Shop ID from bePaid backoffice |
| `BEPAID_SECRET_KEY` | for bePaid tools | Secret key |
| `BEPAID_API_BASE_URL` | no | Default `https://api.bepaid.by` |
| `WEBPAY_STORE_ID` | for WEBPAY tools | Merchant store id |
| `WEBPAY_SECRET_KEY` | for WEBPAY tools | Signature secret |
| `WEBPAY_PAYMENT_BASE_URL` | no | Sandbox/prod payment URL |
| `HUTKIGROSH_USER` | for Hutki tools | API login |
| `HUTKIGROSH_PASSWORD` | for Hutki tools | API password |
| `HUTKIGROSH_API_BASE_URL` | no | Default `https://www.hutkigrosh.by/API/v1` |
| `ASSIST_MERCHANT_ID` | for Assist tools | Merchant id |
| `ASSIST_PAYMENT_BASE_URL` | no | Default test/prod Assist host |
| `ERIP_MCP_ENV` | no | `sandbox` (default) or `production` |
| `ERIP_MCP_ALLOW_WRITE` | production writes | Set `1` to allow create/cancel/delete in production |

## Tools

### Express-Pay ERIP / E-POS — verified in sandbox e2e*

| Tool | API | Live e2e |
|------|-----|----------|
| `express_pay_erip_list_invoices` | `GET /v1/invoices` | yes |
| `express_pay_erip_create_invoice` | `POST /v1/invoices` | yes |
| `express_pay_erip_get_invoice` | `GET /v1/invoices/{id}` | yes |
| `express_pay_erip_get_invoice_status` | `GET /v1/invoices/{id}/status` | yes |
| `express_pay_erip_cancel_invoice` | `DELETE /v1/invoices/{id}` | yes |
| `express_pay_epos_get_qrcode` | `GET /v1/qrcode/getqrcode` | not yet |

\*Against Express-Pay’s documented public sandbox tokens, not a private merchant account.

`amount` is in **major units** (e.g. `10.5` → API `10,50`).

### bePaid ERIP — code present, live unknown

| Tool | API | Live e2e |
|------|-----|----------|
| `bepaid_erip_create_payment` | `POST /beyag/payments` (`type: erip`) | no |
| `bepaid_erip_get_payment` | `GET /beyag/payments/:uid` or `?order_id=` | no |
| `bepaid_erip_delete_payment` | `DELETE /beyag/payments/:uid` | no |

`amount` is in **minor units** (e.g. `1000` = 10.00 BYN).  
bePaid uses the same API host with `"test": true` (no separate sandbox URL). The shop must have **ERIP enabled**.

### bePaid KROK — code present, live unknown

| Tool | API | Live e2e |
|------|-----|----------|
| `bepaid_krok_create_payment` | `POST /beyag/transactions/payments` (`method.type: krok`) | no |
| `bepaid_krok_get_transaction` | `GET /beyag/transactions/:uid` | no |

### WEBPAY ERIP — form builder (no remote call)

| Tool | Notes | Live e2e |
|------|-------|----------|
| `webpay_erip_build_checkout` | SHA1 signature + `wsb_tab=erip`; POST fields to WEBPAY | no |

### Hutki Grosh ERIP — code present, live unknown

| Tool | API | Live e2e |
|------|-----|----------|
| `hutkigrosh_erip_create_bill` | `POST /Invoicing/Bill` | no |
| `hutkigrosh_erip_get_bill` | `GET /Invoicing/Bill({id})` | no |
| `hutkigrosh_erip_get_bill_status` | `GET /Invoicing/BillStatus({id})` | no |
| `hutkigrosh_erip_delete_bill` | `DELETE /Invoicing/Bill({id})` | no |
| `hutkigrosh_erip_list_bills` | `GET /Invoicing/Bills(...)` | no |
| `hutkigrosh_erip_get_qrcode` | `GET /Invoicing/BillQRCode(...)` | no |

### Assist — form builders (no remote call)

| Tool | Notes | Live e2e |
|------|-------|----------|
| `assist_build_payment_checkout` | Fields for `/pay/order.cfm` | no |
| `assist_build_create_bill` | Fields for `/bill/createbill.cfm` | no |

## Resources

- `erip://docs/overview`
- `erip://docs/legal`
- `erip://docs/bepaid-erip`

## Roadmap

- Live verification of bePaid / WEBPAY / Hutki / Assist / KROK with real merchant accounts  
- E2E for `express_pay_epos_get_qrcode`  
- No generic `create_payment` facade  

See [docs/plan-mcp-server.md](docs/plan-mcp-server.md).

## License

MIT
