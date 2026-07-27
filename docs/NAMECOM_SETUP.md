# name.com domain reseller setup

Aarvanta Build OS sells domains through the **name.com Core API** as a reseller. Customers pay via Stripe; Aarvanta registers the domain against your name.com account balance / payment method.

OpenSRS remains in the codebase as a fallback only when name.com credentials are absent.

## 1. Create a reseller account

1. Sign up at [name.com](https://www.name.com/) as a reseller. Prefer a **shared company username** (not Google/SSO email) — see [Getting started](https://docs.name.com/guides/getting-started).
2. In Account Settings → Security, enable **API Access** if 2FA is on.
3. Create tokens at [Account → API](https://www.name.com/account/settings/api):
   - **Development/Test Environment** token (sandbox)
   - **Production** token (live)
4. Fund the account (credit or card on file) so production registrations can bill wholesale cost.

Docs: [Reseller quickstart](https://docs.name.com/guides/quickstart)

## 2. Environment variables

Add to `.env.local` / Vercel:

```bash
NAMECOM_USERNAME=your_reseller_username
NAMECOM_API_TOKEN_DEV=your_sandbox_token
NAMECOM_API_TOKEN=your_production_token
NAMECOM_ENV=test          # or live

# Shared retail pricing (USD wholesale → shopper currency)
DOMAIN_RETAIL_MARKUP_PCT=25
DOMAIN_USD_TO_GBP_RATE=0.79
# DOMAIN_ALLOW_PREMIUM=true

# Default WHOIS / registrant (DOMAIN_CONTACT_* preferred; NAMECOM_/OPENSRS_ aliases work)
DOMAIN_CONTACT_FIRST=Domain
DOMAIN_CONTACT_LAST=Admin
DOMAIN_CONTACT_ORG=Aarvanta Limited
DOMAIN_CONTACT_EMAIL=domains@yourdomain.com
DOMAIN_CONTACT_PHONE=+44.2000000000
DOMAIN_CONTACT_ADDRESS1=1 Example Street
DOMAIN_CONTACT_CITY=London
DOMAIN_CONTACT_STATE=England
DOMAIN_CONTACT_POSTAL=EC1A 1BB
DOMAIN_CONTACT_COUNTRY=GB
```

Optional: `NAMECOM_FORCE_LIVE=true` forces the name.com client even when `APP_MODE=demo` (sandbox testing only).

| Env | Sandbox (`NAMECOM_ENV=test`) | Production (`NAMECOM_ENV=live`) |
|-----|------------------------------|----------------------------------|
| Username | `{NAMECOM_USERNAME}-test` (auto-appended if missing) | `NAMECOM_USERNAME` |
| Token | `NAMECOM_API_TOKEN_DEV` (falls back to `NAMECOM_API_TOKEN`) | `NAMECOM_API_TOKEN` |
| Host | `https://api.dev.name.com` | `https://api.name.com` |

Auth is HTTP Basic: `username:token`.

## 3. How it works in the app

| Step | Behaviour |
|------|-----------|
| Search | `POST /api/build/domains/search` → name.com `domains:checkAvailability` → retail GBP/USD with markup |
| Checkout | Stripe Checkout (`kind: domain`) charges the customer |
| Fulfill | `checkout.session.completed` → name.com `POST /core/v1/domains` (privacy + autorenew on) → stores `registrarOrderId` |

Demo mode (`APP_MODE` unset / not `production`) keeps the offline heuristic catalog unless `NAMECOM_FORCE_LIVE=true`.

Defaults (override only if product asks):
- **Privacy** enabled on create (name.com applies only when the TLD supports it)
- **Auto-renew** follows the checkout toggle (default on)
- **Nameservers** stay on name.com DNS until set-nameserver automation is added

## 4. Checklist before go-live

- [ ] Reseller account activated and funded
- [ ] Sandbox: `GET /core/v1/hello` works with `-test` username + dev token
- [ ] Sandbox search + register tested (`NAMECOM_ENV=test`, optionally `NAMECOM_FORCE_LIVE=true`)
- [ ] Production token set; `NAMECOM_ENV=live`
- [ ] WHOIS contact env vars set on Vercel
- [ ] Stripe webhook `checkout.session.completed` live
- [ ] `GET /api/health` / system status shows name.com reseller as ok
