# Brevo — Email Outreach (super admin)

Email OS (`/outreach`) sends CRM outreach through [Brevo](https://www.brevo.com) transactional email. Gmail IMAP/SMTP stays the mailbox for inbox sync and operational mail. Brevo is **send + tracking only**.

Access is **super admin only** in production (`admin@aarvanta.co`, `AUTH_EMAIL`, and `SUPER_ADMIN_EMAILS`). Demo mode shows the module so you can exercise the UI without login.

## 1. Create a Brevo key

Email OS accepts either:

- **SMTP key** (`xsmtpsib-…`) → **Settings → SMTP & API → SMTP** → Generate. Set `BREVO_SMTP_KEY`.
- **v3 API key** (`xkeysib-…`) → **Settings → SMTP & API → API Keys & MCP**. Set `BREVO_API_KEY`.

Do not paste an SMTP key into `BREVO_API_KEY` expecting the REST account check to work — the app detects `xsmtpsib-` and uses SMTP automatically.

## 2. Verify the sender

Brevo will reject sends from an unverified address.

1. **Settings → Senders, domains & dedicated IPs → Senders**.
2. Add and verify `admin@aarvanta.co` (or your chosen from-address).
3. Set:

```bash
BREVO_SMTP_KEY=xsmtpsib-...
BREVO_SENDER_EMAIL=admin@aarvanta.co
BREVO_SENDER_NAME=Aarvanta
BREVO_WEBHOOK_SECRET=a-long-random-secret
```

## 3. Webhook (opens, clicks, bounces)

1. **Transactional → Settings → Webhook**.
2. URL: `https://YOUR_DOMAIN/api/webhooks/brevo?secret=$BREVO_WEBHOOK_SECRET`
3. Subscribe to: delivered, unique_opened, click, hardBounce, softBounce, blocked, spam, unsubscribed, error.

Without `BREVO_WEBHOOK_SECRET`, production webhooks return 401.

## 4. Cron

`GET /api/cron/email-campaigns` (Bearer `CRON_SECRET`) drains the send queue. Vercel Cron runs it daily (Hobby limit). Starting a campaign also sends the first batch immediately.

## 5. Merge fields

| Token | Source |
|-------|--------|
| `{{firstName}}` | CRM contact |
| `{{lastName}}` | CRM contact |
| `{{fullName}}` | first + last |
| `{{email}}` | CRM email |
| `{{company}}` | Linked company name |
| `{{jobTitle}}` | CRM job title |

## 6. Demo vs live

| Mode | Behavior |
|------|----------|
| Demo, no API key | Sends are simulated and marked delivered |
| Production + `BREVO_API_KEY` | Live transactional sends |
| Missing sender verification | Brevo returns 400; queue item is `failed` |

Replies still land in Gmail and sync into the unified inbox. Do not change Google Workspace MX for Brevo.
