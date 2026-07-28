# Preliminary legal research: does a public ERIP MCP violate Belarusian law?

> **Not legal advice.** This is a map of public findings (Jul 2026) to guide design and risk. Before publishing or commercializing, consult a Belarusian lawyer (and, if relevant, counsel in the country where you publish the package).

**Legend:** `✓` statute or institutional source · `~` inference · `?` unverified / grey area

---

## 1. Operational conclusion (summary)

| MCP scenario | Likely to violate 164-З by itself? | Risk level |
|--------------|------------------------------------|------------|
| **Local** client (`npx`/stdio) calling an **already authorized PSP** API with the **merchant’s own keys** | ~ No: you are not a payment service provider; you ship integration software | **Low–medium** (PSP contracts + personal data + key misuse) |
| **Remote** multi-tenant server processing many merchants’ payments with **your** keys or holding funds | ~ May qualify as aggregator / payment service activity → NBRB registration | **High** |
| Claiming to be an “official ERIP / НКФО integration” without being one | ~ Reputational / misrepresentation risk; not the core of 164-З | **Medium** |
| Publishing docs + examples only, without charge tools | ✓ Strong analogy to already-public documentation | **Low** |

✓ Absence of a well-known “ERIP MCP” **does not imply** a ban: the market is small, MCP is recent, the official НКФО API is under NDA, and **at least one** community bePaid MCP already exists ([theYahia/bepaid-mcp](https://github.com/theYahia/bepaid-mcp), 0 stars, MIT, 2026) — card-focused, not ERIP.

---

## 2. Relevant legal framework

### 2.1 Law No. 164-З (19.04.2022) — payment systems and services

✓ Sources: [pravo.by H12200164](https://pravo.by/document/?guid=3871&p0=H12200164), [NBRB FAQ](https://www.nb-rb.by/today/faq/o_primemenii_zakona_o-platezhnih_uslugah.htm).

✓ Among other definitions:

- **Платежный агрегатор** (payment aggregator) — receives payments from initiators for third parties and remits funds/info.
- **Эквайринг платежных операций** (payment acquiring) — acceptance of payments for third parties under contract with the beneficiary.
- **Поставщик платежных услуг** (payment service provider) — entity that provides payment services and must be on the National Bank **реестр** (register) (art. 34), subject to narrow exceptions.

✓ Payment service types subject to registration (NBRB FAQ, Q8): settlement services, issuance/distribution of instruments, aggregator acquiring, clearing, processing, **informational payment services**, etc.

✓ ERIP is a **socially significant payment system**; participants include settlement centers, payment aggregators, technical/informational aggregators, and service producers ([NBRB on ERIP](https://www.nb-rb.by/payment/erip/about.htm)).

**Implication (~):** the law regulates **who provides the payment service**, not “who writes an HTTP client to an already registered PSP’s API.”

### 2.2 NBRB Instruction No. 453 (order of providing payment services)

✓ Details aggregator requirements, including ERIP participation (contracts with settlement center and НКФО, PTC, security, status application).  
Secondary source: [neg.by summary](https://neg.by/novosti/otkrytj/natsbank-opredelil-poryadok-uchastiya-platezhnykh-agregatorov-v-sisteme-erip/).

**Implication (~):** that applies to **aggregators**, not to a merchant’s plugin/CMS/MCP.

### 2.3 Provider register vs software register

| Register | Who / what | Relevant to open-source MCP? |
|----------|------------|------------------------------|
| **Реестр поставщиков платежных услуг** | Whoever **provides** payment services | ✓ Only if *you* provide the service |
| **Реестр программных средств… and платежных программных приложений** | Software/apps used by payment-market participants (groups МБ, ПК, АР, ПП, etc.) | ? A merchant-side MCP **probably** does not fall into typical categories (ATMs, bank-doc printing, PSP payment apps); no public evidence that Hutki/bePaid CMS modules must be listed as a requirement on the *module author* |

Sources: [provider register](https://www.nb-rb.by/payment/register_of_payment_service_providers.htm), [software register](https://www.nb-rb.by/payment/oversight/register.htm).

### 2.4 Law No. 99-З (07.05.2021) — personal data

✓ If the flow handles PII (payer name, phone, email), personal-data law applies.  
✓ Controller / processor: legal bases, security measures, liability.  
~ On a **local** MCP with merchant keys, the controller is usually the **merchant** (and the PSP); the npm package author does not process data *unless* they host something that sees payloads.

### 2.5 Cybersecurity of payment services

✓ NBRB instruction on information protection when providing payment services ([pravo.by B22239010](https://pravo.by/document/?guid=3871&p0=B22239010)) — aimed at **поставщики платежных услуг**.  
~ An open-source merchant client is not automatically that subject; the merchant/PSP still have their own duties.

### 2.6 Aggregator contract (not statute, but can block usage)

✓ Example EasyPay / «Открытый контакт» (ERIP aggregator): the PTS **must not** hand network/API credentials to unauthorized third parties; it may authorize a duly empowered person and remains responsible for their use ([EasyPay rules](https://ssl.easypay.by/docs/rules_raschet/)).

~ Implication for MCP: the merchant may use the MCP **as their own tool**; sharing Shop ID/Secret with a third-party SaaS MCP or pasting secrets into public issues conflicts with the contract.

✓ Aggregators themselves publish **APIs + CMS modules** (bePaid, Hutki Grosh, Express-Pay, WebPay): third-party software integration is an **expected** market pattern, not a taboo.

---

## 3. What a “safe-by-design” `erip-mcp` would (and would not) do

### 3.1 Design aligned with lower regulatory risk (~)

1. **Client only**: stdio/`npx`, no fund processing.  
2. **Merchant credentials**: local env vars; never package-maintainer keys for other people’s charges.  
3. **Backend = registered PSP** (bePaid, WebPay, Express-Pay…), not the NDA НКФО protocol.  
4. **Clear disclaimer**: “We are not a payment service provider or official ПС ЕРИП participant; we are not on the NBRB register; the user must have a contract with an aggregator/producer.”  
5. **Do not** present as “official ERIP API.”  
6. Default **sandbox**; production writes behind an explicit flag.  
7. Do not log secrets or PII.  
8. README: user is responsible under 164-З / 99-З / PSP contract.

### 3.2 Designs that raise risk (~)

| Design | Why it worries |
|--------|----------------|
| **Hosted** multi-merchant MCP with your API keys | Looks like acquiring/aggregation |
| Receiving money in your account and redistributing | Classic aggregator activity |
| Storing PAN / CVV | PCI + shop host-to-host permissions + 99-З |
| “One-click pay for anyone without an ERIP contract” | Bypassing service producer / aggregator |
| Reusing one global shop_id for third parties | ToS + possible covert payment service |

---

## 4. Market analogies (why “nobody did it” ≠ illegal)

| Fact | Reading |
|------|---------|
| ✓ Public Hutki/bePaid/WebPay CMS modules | Integrating aggregator APIs is normal practice |
| ✓ Public aggregator API docs | No absolute legal secrecy over “how to call the API” |
| ✓ НКФО online protocol under NDA | Explains absence of an “official pure ERIP” MCP |
| ✓ [bepaid-mcp](https://github.com/theYahia/bepaid-mcp) exists (MIT, npm-style) | Someone already shipped a BY payments MCP; low visibility |
| ✓ Official Stripe/PayPal/Square MCPs | “MCP + merchant keys” is accepted internationally |
| ~ BY market ~9M, docs in RU, Western sanctions, young MCP | Explains scarcity better than an express ban |

? No rule found that says: “it is forbidden to publish an open-source client for an ERIP aggregator’s API.”

---

## 5. Residual risks (honest)

1. **Misclassification** — if marketing or product behavior looks like a PSP, NBRB / counterparties may treat it as one (`?` case by case).  
2. **PSP ToS** — contract breach ≠ crime, but they can cut the shop.  
3. **Personal data** — hosting or telemetry that sees payloads.  
4. **“платежное программное приложение” register** — `?` if a PSP someday asks to include the software in its compliance chain; not a typical requirement for plugin authors.  
5. **Foreign sanctions** — aside from Belarusian law: publishing/using BY fintech from some jurisdictions can add friction (banking, npm org, contributors). Not 164-З, but affects a “global public” repo.  
6. **Civil liability** — wrong charges made by an AI agent using your tools; mitigate with confirmations and scopes.

---

## 6. Concrete lawyer checklist

- [ ] Does an open-source npm package that only forwards calls to a registered aggregator’s API, with the client’s keys, constitute “оказание платежных услуг”?  
- [ ] Does the answer change if the same code is offered as a **remote SaaS MCP**?  
- [ ] Any duty to enroll in the программных средств register for the **author** of the client (not the PSP)?  
- [ ] 99-З requirements if the README encourages sending payer PII through an LLM/client.  
- [ ] Use of “ЕРИП”, “E-POS” marks / logos (IP / misleading advertising).  
- [ ] If the maintainer is **not** a BY resident: practical extraterritorial reach of 164-З?

---

## 7. Sources

### Statutes / NBRB
- [Law 164-З](https://pravo.by/document/?guid=3871&p0=H12200164)  
- [NBRB FAQ on 164-З](https://www.nb-rb.by/today/faq/o_primemenii_zakona_o-platezhnih_uslugah.htm)  
- [ERIP — NBRB](https://www.nb-rb.by/payment/erip/about.htm)  
- [Payment service provider register](https://www.nb-rb.by/payment/register_of_payment_service_providers.htm)  
- [Payment-market software register](https://www.nb-rb.by/payment/oversight/register.htm)  
- [Law 99-З personal data](https://etalonline.by/document/?regnum=h12100099)  
- [Payment-service cybersecurity instruction](https://pravo.by/document/?guid=3871&p0=B22239010)  
- ERIP operator documents: [raschet.by/documenty](https://raschet.by/documenty-operatora/ps-erip/)

### Secondary / market
- [Art Legal — payment law summary](https://artlegal.by/en/info-centre/news/new-law-on-payment-systems-and-services-in-belarus/)  
- [EasyPay — API / credential terms](https://ssl.easypay.by/docs/rules_raschet/)  
- [bePaid docs](https://docs.bepaid.by/)  
- [theYahia/bepaid-mcp](https://github.com/theYahia/bepaid-mcp)  
- Project technical plan: [`plan-mcp-server.md`](./plan-mcp-server.md)

---

## 8. Recommendation for this repo

~ Proceeding with the technical plan **is reasonable** from the angle “open-source client + merchant keys + registered PSP” — the same pattern as CMS modules and Stripe MCP.

Before `npm publish`:

1. Legal disclaimer in README (not a PSP, not affiliated with НКФО ЕРИП).  
2. **Local-first** architecture; hosted only with separate legal analysis.  
3. No PAN capture; ERIP/invoices/QR first.  
4. Short legal consult (1–2 h with a BY lawyer) if you monetize or offer cloud.

**Updated:** 2026-07-28
