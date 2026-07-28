# Changelog

## 0.1.2

- WEBPAY ERIP: `webpay_erip_build_checkout` (signed form fields, `wsb_tab=erip`)
- Hutki Grosh ERIP: bill create/get/status/delete/list + QR
- Assist BY: hosted payment + createbill form builders
- bePaid KROK: `bepaid_krok_create_payment`, `bepaid_krok_get_transaction`
- Config env vars for WEBPAY / Hutki / Assist

## 0.1.1

- Express-Pay provider: list/create/get/status/cancel invoice + E-POS QR
- Public sandbox e2e behind `ERIP_MCP_LIVE=1`
- HMAC-SHA1 signature helper aligned with Express-Pay docs

## 0.1.0

- Initial MCP server (stdio)
- Docs resources: overview, legal, bePaid ERIP notes
- bePaid ERIP tools: `bepaid_erip_create_payment`, `bepaid_erip_get_payment`, `bepaid_erip_delete_payment`
- Sandbox default; production write guard via `ERIP_MCP_ALLOW_WRITE`
