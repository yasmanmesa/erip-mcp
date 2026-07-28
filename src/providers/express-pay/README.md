# Express-Pay provider

Tools (v1+):

- `express_pay_erip_list_invoices`
- `express_pay_erip_create_invoice`
- `express_pay_erip_get_invoice`
- `express_pay_erip_get_invoice_status`
- `express_pay_erip_cancel_invoice`
- `express_pay_epos_get_qrcode`

Public sandbox (from Express-Pay docs):

- Base: `https://sandbox-api.express-pay.by/v1`
- Token (service 4): `a75b74cbcfe446509e8ee874f421bd66`
- Secret word: `sandbox.expresspay.by`

```bash
export EXPRESS_PAY_TOKEN=a75b74cbcfe446509e8ee874f421bd66
export EXPRESS_PAY_SECRET_WORD=sandbox.expresspay.by
export ERIP_MCP_ENV=sandbox
ERIP_MCP_LIVE=1 npm test -- src/providers/express-pay/e2e.test.ts
```
