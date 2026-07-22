# OpenSRS domain reseller setup

Aarvanta Build OS sells domains through the **OpenSRS (Tucows)** wholesale reseller API. Customers pay via Stripe; Aarvanta registers the domain against a prepaid OpenSRS balance.

## 1. Create a reseller account

1. Sign up at [opensrs.com/become-a-domain-reseller](https://opensrs.com/become-a-domain-reseller/) (or [join.opensrs.com](https://join.opensrs.com/)).
2. Pay the one-time **$95** activation fee (converted to account credit). There is no monthly fee.
3. Log in to the Reseller Control Panel: [manage.opensrs.com](https://manage.opensrs.com).
4. Fund your account balance (wire / card / PayPal — deposits are in **USD**). Keep enough credit for expected registrations.

## 2. Enable API access

1. In the Reseller Control Panel, open **Settings → API**.
2. Generate / copy your **API key**.
3. Note your **reseller username**.
4. For **production (`OPENSRS_ENV=live`)**, whitelist the egress IPs of your host (e.g. Vercel static IPs or a fixed NAT). Horizon sandbox does not require IP allowlisting.
5. Practice in Horizon first: [manage.test.opensrs.com](https://manage.test.opensrs.com) — set `OPENSRS_ENV=test`.

## 3. Environment variables

Add to `.env.local` / Vercel:

```bash
OPENSRS_USERNAME=your_reseller_username
OPENSRS_API_KEY=your_api_key
OPENSRS_ENV=test          # or live
DOMAIN_RETAIL_MARKUP_PCT=25
DOMAIN_USD_TO_GBP_RATE=0.79

# Registrant WHOIS defaults (used on SW_REGISTER)
OPENSRS_CONTACT_FIRST=Domain
OPENSRS_CONTACT_LAST=Admin
OPENSRS_CONTACT_ORG=Aarvanta Limited
OPENSRS_CONTACT_EMAIL=domains@yourdomain.com
OPENSRS_CONTACT_PHONE=+44.2000000000
OPENSRS_CONTACT_ADDRESS1=1 Example Street
OPENSRS_CONTACT_CITY=London
OPENSRS_CONTACT_STATE=England
OPENSRS_CONTACT_POSTAL=EC1A 1BB
OPENSRS_CONTACT_COUNTRY=GB
```

Optional: `OPENSRS_FORCE_LIVE=true` forces the OpenSRS client even when `APP_MODE=demo` (for local Horizon tests).

## 4. How it works in the app

| Step | Behaviour |
|------|-----------|
| Search | `POST /api/build/domains/search` → OpenSRS `LOOKUP` + `GET_PRICE` → retail GBP/USD with markup |
| Checkout | Stripe Checkout (`kind: domain`) charges the customer |
| Fulfill | `checkout.session.completed` webhook → OpenSRS `SW_REGISTER` → stores `registrarOrderId` |

Demo mode (`APP_MODE` unset / not `production`) keeps the offline heuristic catalog and never calls OpenSRS unless `OPENSRS_FORCE_LIVE=true`.

## 5. Checklist before go-live

- [ ] Reseller account activated and funded
- [ ] Horizon sandbox search + register tested
- [ ] Production API key + IP allowlist configured
- [ ] `OPENSRS_ENV=live` and contact env vars set on Vercel
- [ ] Stripe webhook `checkout.session.completed` live
- [ ] `GET /api/health` shows OpenSRS readiness as ok
