# Work plan: `erip-mcp` (public MCP server)

Date: 2026-07-28  
Last update: 2026-07-28 (platform-specific naming + multi-API vision; providers through 0.1.2)  
Stack: **TypeScript + npm** (`@modelcontextprotocol/sdk`)  
Product: **domain-specific** ERIP app — tools are **platform-specific**, not Stripe-style generics

Related docs: [`belarus-payment-apis.md`](./belarus-payment-apis.md) · [`legal-research-belarus.md`](./legal-research-belarus.md)

---

## 1. Goal and positioning

Ship an npm package with a **local MCP server** (`npx` / stdio) to operate **ERIP / E-POS / KROK** through public APIs of Belarusian **aggregators**.

### What it is

- A **narrow domain app**: each tool names the platform (`bepaid_erip_…`, `express_pay_…`), like `pay_with_paypal` — not an abstract `create_payment`.
- A **1:1 mirror** of each aggregator’s documented API (one tool ≈ one endpoint/method).
- Able, on the roadmap, to cover **several APIs** into the same “ERIP world” (ERIP has no public developer API of its own).

### What it is not

| Project | Focus | Relation to us |
|---------|-------|----------------|
| [bepaid-mcp](https://github.com/theYahia/bepaid-mcp) | bePaid **cards** (capture, void, refund, tokenize, subscriptions) | Complementary; **not** a substitute for an ERIP MCP |
| НКФО ЕРИП online protocol | NDA, dedicated channel | Out of scope |
| Stripe-like generic Payment Links | Unified abstraction | Avoid in tool design |

### v1 public MVP scope (historical)

- **Multi-provider** architecture in code (`src/providers/…`)
- Initially one implemented provider (**bePaid ERIP**), then Express-Pay and others
- Channel focus: **ERIP / E-POS / KROK** — not card acquiring
- Auth: **merchant** env vars (local-first; see legal doc)
- Sandbox by default; production writes behind an explicit flag
- Disclaimer: not a PSP and not affiliated with НКФО ЕРИП

### Explicitly out of early MVP (then backlog — partly done in 0.1.1–0.1.2)

- Extra providers with their own tool prefixes (`express_pay_*`, `webpay_*`, …)
- KROK tools when the PSP documents them separately
- Hosted multi-tenant MCP (needs separate legal analysis)
- NDA НКФО protocol

---

## 2. Design principles

| Principle | Meaning |
|-----------|---------|
| **Custom / platform-specific** | Tool names include aggregator + channel. e.g. `bepaid_erip_create_payment`, not `create_payment`. |
| **1:1 with the API** | One tool ≈ one documented endpoint. No unified facade that hides differences. |
| **Multi-API vision** | ERIP is reached via bePaid, Express-Pay, WebPay, Hutki… The package can add providers without renaming earlier tools. |
| **Ship one, shape for many** | v1 implements one provider; `providers/` and tool registration already anticipate N. |
| **Do not compete with bepaid-mcp** | Do not reimplement card tools; document “use bepaid-mcp for cards” if needed. |
| **Safe by default** | `sandbox`; `ERIP_MCP_ALLOW_WRITE=1` in production. |
| **Public = reproducible** | `npx`, LICENSE, CI, no secrets. |
| **Docs as resources** | Legal/API research usable without credentials. |

### Tool naming convention

```
{provider}_{channel}_{action}
```

Examples:

- `bepaid_erip_create_payment`
- `bepaid_erip_get_payment`
- `bepaid_erip_delete_payment`
- `express_pay_erip_create_invoice`
- `express_pay_epos_get_qrcode`
- `bepaid_krok_create_payment`
- `webpay_erip_build_checkout`
- `hutkigrosh_erip_create_bill`
- `assist_build_payment_checkout`

Descriptions in English (npm / agent audience), with explicit PSP and endpoint mentions.

---

## 3. Providers

| Provider | Channel | Status (0.1.2) | Notes |
|----------|---------|----------------|-------|
| **Express-Pay** | Invoices + E-POS QR | **Implemented + sandbox e2e** | Public sandbox tokens |
| **bePaid** | ERIP + KROK | Implemented, unverified live | Needs shop with ERIP/KROK |
| **WEBPAY** | ERIP checkout form | Implemented, unverified live | Signed form builder |
| **Hutki Grosh** | Invoicing API | Implemented, unverified live | Session cookie auth |
| **Assist** | Hosted forms | Implemented, unverified live | Form field builders |
| НКФО online | NDA protocol | Never (this repo) | — |

Config: activate providers when their env credentials are present (`BEPAID_SHOP_ID`, `EXPRESS_PAY_TOKEN`, `WEBPAY_*`, etc.). No required `ERIP_MCP_PROVIDER` list.

---

## 4. npm package shape

### 4.1 Publishing

- Name: `erip-mcp`
- `bin`: `erip-mcp`
- Node ≥ 20

```json
{
  "mcpServers": {
    "erip": {
      "command": "npx",
      "args": ["-y", "erip-mcp"],
      "env": {
        "EXPRESS_PAY_TOKEN": "...",
        "EXPRESS_PAY_SECRET_WORD": "...",
        "ERIP_MCP_ENV": "sandbox",
        "ERIP_MCP_ALLOW_WRITE": "0"
      }
    }
  }
}
```

~ Prefixes like `BEPAID_*` / `EXPRESS_PAY_*` make clear which keys belong to which PSP.

### 4.2 Structure

```
erip-mcp/
├── README.md
├── LICENSE
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── config.ts
│   ├── server.ts
│   ├── providers/
│   │   ├── types.ts
│   │   ├── bepaid/
│   │   ├── express-pay/
│   │   ├── webpay/
│   │   ├── hutkigrosh/
│   │   └── assist/
│   └── resources/
│       └── docs.ts
├── docs/
│   ├── belarus-payment-apis.md
│   ├── legal-research-belarus.md
│   └── plan-mcp-server.md
├── examples/
│   └── cursor-mcp.json
└── .github/workflows/ci.yml
```

### 4.3 Dependencies

- `@modelcontextprotocol/sdk`, `zod`
- Dev: `typescript`, `tsx`, `vitest`, `@types/node`

---

## 5. MCP surface

### 5.1 bePaid ERIP

| Tool | bePaid API | Mutation |
|------|------------|----------|
| `bepaid_erip_create_payment` | `POST /beyag/payments` (`payment_method.type: erip`) | write |
| `bepaid_erip_get_payment` | GET by UID / order_id | read |
| `bepaid_erip_delete_payment` | DELETE payment request | write |

`create` should surface API-useful fields as returned: `uid`, status, `erip.instruction`, `qr_code` / `qr_code_raw`, bank deeplinks when present.

**Do not** add a generic `create_payment`, card tools, or wrappers named differently from the API.

### 5.2 Express-Pay, WEBPAY, Hutki, Assist, KROK

See README status table for the full tool list and live-verification notes.

### 5.3 Resources (no credentials)

- `erip://docs/overview` → BY / ERIP API overview  
- `erip://docs/legal` → preliminary legal research  
- `erip://docs/bepaid-erip` → short note + docs.bepaid.by ERIP links  

---

## 6. Work phases

### Phase 0 — Setup (0.5–1 day) — ✅ done

- [x] `package.json` (module, `bin`, `files`, `engines`)
- [x] Strict TypeScript → `dist/`
- [x] Minimal MCP stdio + resources
- [x] README: positioning vs bepaid-mcp, naming, legal disclaimer
- [x] MIT LICENSE, `.gitignore`, CI

### Phase 1 — Config + bePaid client (1 day) — ✅

- [x] Env `BEPAID_*` / `ERIP_MCP_ENV` / `ERIP_MCP_ALLOW_WRITE`
- [x] Typed HTTP Basic client; no secret logging
- [x] `ProviderModule` interface
- [x] Config tests

### Phase 2 — Read tools `bepaid_erip_*` (1 day) — ✅

- [x] `bepaid_erip_get_payment`
- [x] Zod schemas; readable API errors
- [x] Unit tests with mocked fetch

### Phase 3 — Write tools (1–2 days) — ✅ code; ⏳ bePaid live still pending

- [x] `bepaid_erip_create_payment`
- [x] `bepaid_erip_delete_payment`
- [x] Production + `ALLOW_WRITE` guardrail
- [ ] Exercise create/get against a real bePaid sandbox shop

### Phase 4 — Publish (1 day) — ⏳ pending

- [x] English README + docs
- [x] `examples/cursor-mcp.json`
- [x] CHANGELOG, semver through `0.1.2`
- [ ] `npm publish`, GitHub Release

### Phase 5 — Multi-API backlog — ✅ largely done in 0.1.1–0.1.2

- [x] Express-Pay `express_pay_*` (+ public sandbox e2e)
- [x] Credential-gated provider activation
- [x] `bepaid_krok_*`
- [x] WEBPAY / Hutki / Assist providers
- [ ] Webhook helper (doc + verify; no mandatory server)
- [ ] Publish-on-tag CI

---

## 7. Security and legal (public repo)

Aligned with [`legal-research-belarus.md`](./legal-research-belarus.md):

- [x] Local-first; no multi-tenant SaaS in this package
- [x] Merchant keys only; never maintainer keys for third-party charges
- [x] Disclaimer: not a PSP, not affiliated with НКФО ЕРИП; user owns aggregator contract
- [x] No PAN capture / no card tools in this package
- [x] `.gitignore` + no-secrets guidance
- [ ] Conservative rate limits / retries (ongoing)

---

## 8. MVP acceptance criteria

1. `npx` installs and starts without cloning.  
2. Published tools use platform prefixes (`bepaid_erip_*`, `express_pay_*`, …).  
3. No overlap with bepaid-mcp’s card focus.  
4. Doc resources work without API keys.  
5. At least one provider verified live (Express-Pay sandbox).  
6. CI green + LICENSE + npm release.  
7. `providers/` supports additional APIs without renaming existing tools.

---

## 9. Short checklist

1. Confirm npm name + MIT LICENSE.  
2. Scaffold + resources.  
3. bePaid provider + `bepaid_erip_*`.  
4. `create` + `delete` + guardrails.  
5. README (multi-API / naming).  
6. Publish `0.1.x`.  
7. Add other providers under their own prefixes.

---

## 10. Estimate (historical MVP)

| Phase | Effort |
|-------|--------|
| 0 Setup | 0.5–1 day |
| 1 Config/client | 1 day |
| 2 Read tools | 1 day |
| 3 Write tools | 1–2 days |
| 4 Publish | 1 day |
| **Total MVP** | **~5–6 days** |

---

## 11. Open decisions

- [x] npm name: `erip-mcp`  
- [x] Implement Express-Pay (and later others) under platform prefixes  
- [ ] Consult a BY lawyer before monetization / hosted MCP? (recommended for SaaS; optional for local open-source client only)
