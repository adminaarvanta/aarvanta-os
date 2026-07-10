# Aarvanta OS — Future milestones

Pending integrations and features deferred from the current sprint. Use this file when picking up the next milestone.

---

## Milestone: Stripe billing (Module 11)

**Status:** UI + demo data only — live Stripe not wired.

### Why we need it

- SaaS subscription plans for Aarvanta OS customers
- Usage-based billing (AI runs, seats, storage)
- Invoice history synced to Finance OS

### Planned env vars

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

### Features to implement

| Feature | Route / surface | Notes |
|---------|-----------------|-------|
| Checkout session | `POST /api/billing/checkout` | Create Stripe Checkout for plan upgrade |
| Customer portal | `POST /api/billing/portal` | Manage payment method, cancel |
| Webhook handler | `POST /api/webhooks/stripe` | `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated` |
| Subscription sync | `billing_subscriptions` Firestore | Map `stripeCustomerId`, `stripeSubscriptionId`, status |
| Usage metering | `billing_usage_records` | Report AI tokens, agent runs, seats monthly |
| Finance bridge | Finance OS | Post paid invoices to `finance_journal_entries` |
| Integrations UI | `/integrations` | Replace demo "connected" with OAuth/API key flow |

### Webhook events to subscribe

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

### Test plan

1. Stripe test mode keys in preview deployment
2. Complete checkout → subscription appears in `/billing`
3. Webhook idempotency via `webhook_events` collection
4. Cancel in portal → status `canceled` in app

---

## Milestone: Slack integration (Module 6 — Team Collaboration)

**Status:** Deferred — demo connection in Integrations Hub only.

### Why we need it (when enabled)

- Internal team alerts from Communication Center
- HR escalation notifications to `#hr-approvals`
- AI digest summaries to `#founder-daily`
- Optional: slash commands for Founder Copilot

### Planned env vars

```bash
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=xoxb-...
SLACK_DEFAULT_CHANNEL_ID=C...
```

### Features to implement

| Feature | Surface | Notes |
|---------|---------|-------|
| OAuth install | `GET /api/integrations/slack/connect` | Workspace installs bot |
| Post message | `lib/channels/slack-client.ts` | `chat.postMessage` |
| Event subscription | `POST /api/webhooks/slack` | URL verification + events |
| Notification routing | Communication Center settings | Map alert kinds → channels |
| HR escalations | `process-case.ts` | Post to `#hr-approvals` when `riskTier: high` |
| Thread sync | Team Collaboration | Optional two-way with internal channels |

### Slack app scopes (bot)

- `chat:write`
- `channels:read`
- `groups:read`
- `im:write`
- `users:read`

### Test plan

1. Install app to Aarvanta Slack workspace
2. Trigger HR escalation → message in configured channel
3. Communication Center digest → scheduled post

---

## How to use this file

1. Pick a milestone section
2. Create a branch `feat/stripe-billing` or `feat/slack-integration`
3. Implement env vars + API routes + update `spec-coverage.ts` status
4. Remove demo-only connection from `integration-demo-seed.ts` when live
