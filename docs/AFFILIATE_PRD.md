# Partner & Affiliate System — PRD

Growth channel for external partners and existing customers: shared attribution, referred-buyer discounts, CPA + revenue-share earnings, and platform-admin regional caps.

**Status:** Phase 1 + Phase 2 implemented in-app (`/affiliate`, `/r/[code]`, `/referrals`, `/affiliate/admin`).  
**Spec coverage:** `partner-affiliate` (GTM).

---

## 1. Problem

Aarvanta needs a controlled growth channel where partners and customers can refer leads and paying tenants, while Aarvanta retains hard control over **discount depth** and **commission rates by country/region**, plus a clean path from click → lead → sale → income → payout.

---

## 2. Product decisions

| Decision | Choice |
|----------|--------|
| Who can affiliate | **Both**: external partners (dedicated portal) **and** existing customers (in-app opt-in), sharing one engine |
| Buyer incentive | Referred customers get a **discount** via affiliate link/code |
| Affiliate earnings | **CPA** on qualified leads **+ revenue share** on paid conversions |
| Discounts | Separate, admin-configured lever (not the same as commission) |
| Caps | Platform admin sets **max discount % and max commission/CPA by region/country** |

**Partner self-benefit:** Affiliates may hold a free Aarvanta account for portal access; when they buy/upgrade their own paid plan, they may receive a **partner discount** subject to the same regional caps.

---

## 3. Goals & non-goals

**Goals**
- One attribution system for clicks, signups, qualified leads, and paid conversions
- Affiliate self-serve: profile, links/codes, lead board, income, payout requests
- Platform admin: approve affiliates, configure regional caps, review fraud, approve payouts
- Tie referred paid conversions into Stripe subscription lifecycle
- Attribute free-tier signups via existing `provisionFreeTierAccount`

**Non-goals (v1)**
- Multi-tier / MLM networks
- Automatic bank payouts (v1 = request + manual/ops fulfillment; Stripe Connect later)
- White-label reseller billing

---

## 4. Personas

1. **External Partner** — agency/freelancer/marketer; signs up on Affiliate Portal
2. **Customer Affiliate** — existing org member who opts into referrals in-app
3. **Referred Prospect / Buyer** — lands via link/code; may start free; gets capped discount on paid checkout
4. **Platform Admin (Aarvanta)** — configures regional rates/caps, reviews affiliates, payouts

---

## 5. Default policy assumptions

| Policy | Default |
|--------|---------|
| Attribution window | **60 days**, last non-direct affiliate click wins |
| CPA | Once per unique referred email/org |
| Commission | **First paid SaaS invoice only** |
| Earnings hold | **14 days** before `approved` (refund window) |
| Self-referral | Forbidden (same email) |
| Platform admin | `AFFILIATE_ADMIN_EMAILS` allowlist (comma-separated); demo mode allows any signed-in user |

---

## 6. Surfaces

| Surface | Path |
|---------|------|
| Public apply / marketing | `/affiliate` |
| Click redirect | `/r/{code}` → `/register?ref={code}` |
| Affiliate dashboard | `/affiliate/dashboard` |
| In-app customer referrals | `/referrals` |
| Platform admin | `/affiliate/admin` |

---

## 7. Data model

- `Affiliate` — code, status, source (`external` \| `customer`), profile, country/region
- `AffiliateClick` — code, IP/UA hash, timestamp
- `AffiliateAttribution` — tenantId / email → affiliateId, capturedAt, expiresAt
- `AffiliateLeadEvent` — qualification status
- `AffiliateEarning` — `cpa` \| `commission`; pending / approved / paid / clawed_back
- `AffiliatePayoutRequest` — requested / approved / rejected / paid
- `AffiliateRateCard` — per-region defaults + max caps; optional per-affiliate override
- `AffiliateAuditLog` — admin actions

---

## 8. Regional rate card fields

Per `regionCode`:

- `maxDiscountPercent` / `defaultDiscountPercent`
- `maxCpaAmount` / `defaultCpaAmount` + `currency`
- `maxCommissionPercent` / `defaultCommissionPercent`
- `attributionWindowDays` (optional override)
- `payoutMinimum`

Affiliates cannot exceed region max; admin may assign a per-affiliate override ≤ max.

---

## 9. API surface

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/affiliate/apply` | External partner application |
| PUT | `/api/affiliate/apply` | Customer in-app referral opt-in |
| GET/PATCH | `/api/affiliate/me` | Profile, dashboard summary |
| POST | `/api/affiliate/me` | Request payout |
| GET/PATCH | `/api/affiliate/admin` | Admin list / approve / caps / payouts / clawback |
| GET | `/r/[code]` | Record click + set cookie + redirect to register |

Registration accepts optional `referralCode` / `ref` cookie (`aarvanta_aff`). Checkout applies regional discount and stamps `affiliateId` into Stripe metadata; webhook creates commission earnings.

---

## 10. Env

```bash
# Comma-separated emails allowed to manage /affiliate/admin (production)
AFFILIATE_ADMIN_EMAILS=ops@aarvanta.com,finance@aarvanta.com
```

---

## 11. Verify checklist

1. Open `/affiliate`, apply as partner → status `pending`
2. As admin (`AFFILIATE_ADMIN_EMAILS` or demo), approve affiliate at `/affiliate/admin`
3. Visit `/r/{code}` → lands on register with `ref`; cookie `aarvanta_aff` set
4. Complete free signup → attribution + CPA earning (`pending`)
5. Billing checkout with attribution → discount metadata + commission on Stripe paid webhook (or demo checkout simulation)
6. Affiliate requests payout when approved balance ≥ regional minimum; admin marks paid
7. Opt in at `/referrals` as an existing customer → same dashboard engine

---

## 12. Phased delivery

| Phase | Scope |
|-------|--------|
| **1 — Foundation** | Entity, portal apply/login, admin approve, links/clicks, attribution on free signup, regional caps, profile |
| **2 — Monetization** | Checkout discounts, CPA + commission ledger, income UI, payout requests, Stripe hooks, self-referral block, hold period |
| **3 — Harden** (later) | Renewals toggle, richer fraud, exports, Stripe Connect, marketing CTAs |
