# Partner & Affiliate System — PRD

Growth channel for external partners and existing customers: shared attribution, referred-buyer discounts, CPA + revenue-share earnings, and platform-admin regional caps.

**Status:** Phase 1 + Phase 2 implemented in-app.  
**Spec coverage:** `partner-affiliate` (GTM).

### Where to open it

| Entry | Path |
|-------|------|
| Marketing nav / footer **Partners** | `/affiliate` |
| Sidebar shortcuts **Referrals** | `/referrals` |
| Sidebar shortcuts **Partner program** | `/affiliate` |
| Dashboard OS map **PartnerOS** | `/referrals` |
| Header **+** quick action **Start referrals** | `/referrals` |
| Settings → Partner & Affiliate | `/referrals` |
| Billing → **Start referrals** | `/referrals` |
| All Tools → Partner & Affiliate | `/affiliate/dashboard` |
| Admin portal | `/affiliate/admin` |

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
| Partner activation (set password) | `/affiliate/activate/{token}` |
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
| GET/POST | `/api/affiliate/activate` | Validate activation token / set password + session |
| GET/PATCH | `/api/affiliate/me` | Profile, dashboard summary |
| POST | `/api/affiliate/me` | Request payout |
| GET/PATCH | `/api/affiliate/admin` | Admin list / approve / resend activation / caps / payouts / clawback |
| GET | `/r/[code]` | Record click + set cookie + redirect to register |

**Partner login:** Admin approve provisions a free owner workspace (if needed) and emails `/affiliate/activate/{token}`. Partners who already have credentials are linked and notified without a set-password step. Registration accepts optional `referralCode` / `ref` cookie (`aarvanta_aff`). Checkout applies regional discount and stamps `affiliateId` into Stripe metadata; webhook creates commission earnings.

---

## 10. Env

```bash
# Comma-separated emails allowed to manage /affiliate/admin (production)
AFFILIATE_ADMIN_EMAILS=ops@aarvanta.com,finance@aarvanta.com
```

---

## 11. Verify checklist

1. Open `/affiliate`, apply as partner → status `pending` (no password yet)
2. As admin (`AFFILIATE_ADMIN_EMAILS`, owner/admin, or demo), approve at `/affiliate/admin`
3. System provisions a free partner workspace (if no login) and emails `/affiliate/activate/{token}` to create a password (demo logs the URL)
4. Partner sets password → signed in → `/affiliate/dashboard`
5. Visit `/r/{code}` → lands on register with `ref`; cookie `aarvanta_aff` set
6. Complete free signup → attribution + CPA earning (`pending`)
7. Billing checkout with attribution → discount metadata + commission on Stripe paid webhook (or demo checkout simulation)
8. Affiliate requests payout when approved balance ≥ regional minimum; admin marks paid
9. Opt in at `/referrals` as an existing customer → same dashboard engine (already logged in)

---

## 12. Phased delivery

| Phase | Scope |
|-------|--------|
| **1 — Foundation** | Entity, portal apply/login, admin approve, links/clicks, attribution on free signup, regional caps, profile |
| **2 — Monetization** | Checkout discounts, CPA + commission ledger, income UI, payout requests, Stripe hooks, self-referral block, hold period |
| **3 — Harden** (later) | Renewals toggle, richer fraud, exports, Stripe Connect, marketing CTAs |
