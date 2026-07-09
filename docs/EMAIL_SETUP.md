# Email setup — Gmail (recommended) and free alternatives

Aarvanta OS replaced Resend with **Gmail IMAP + SMTP** so email uses your existing Google Workspace mailbox (`notifications@aarvanta.co` or `hr@aarvanta.co`) without changing company MX records.

## Why Resend was removed

| Issue with Resend | Gmail approach |
|-------------------|----------------|
| Separate inbound domain (`*.resend.app`) — replies don't land in your normal inbox | Replies go to the same Gmail mailbox your team already uses |
| MX/SPF/DKIM DNS changes can break Google Workspace mail | No MX changes — keep `ASPMX.L.GOOGLE.COM` only |
| Webhook-only inbound — harder to debug | IMAP poll every 5 min + manual sync at `POST /api/email/sync` |
| Third-party deliverability / domain verification steps | Sends from your verified Google Workspace address |

## Free alternatives compared

| Provider | Free tier | Inbound to unified inbox | Outbound SMTP | Keeps Google MX | Best for |
|----------|-----------|--------------------------|---------------|-----------------|----------|
| **Gmail / Google Workspace** | Included with Workspace | ✅ IMAP sync | ✅ App password | ✅ Yes | **Aarvanta (chosen)** |
| Brevo (Sendinblue) | 300 emails/day | ❌ No real inbox sync | ✅ API | ✅ If send-only | Marketing blasts only |
| Mailgun | Trial then paid | Webhooks only | ✅ | ⚠️ Often needs DNS | Developers, not unified inbox |
| Amazon SES | ~62k/mo from EC2 | ❌ | ✅ Very cheap | ⚠️ DNS required | High volume, not inbox |
| Zoho Mail (free) | 1 user | ✅ IMAP | ✅ | ❌ Replaces Google MX | New companies without Workspace |

**Recommendation:** Stay on **Gmail** — it is the only free option that gives true two-way inbox sync without disrupting `aarvanta.co` Google Workspace mail.

## Gmail App Password — step-by-step

You need this for `GMAIL_APP_PASSWORD` in Vercel and `.env.local`.

### Prerequisites

1. A **Google Workspace** account (not personal `@gmail.com` unless you use that mailbox).
2. **2-Step Verification** enabled on the account that will send mail (e.g. `notifications@aarvanta.co`).

### Steps

1. Sign in at [myaccount.google.com](https://myaccount.google.com) as `notifications@aarvanta.co` (or the mailbox in `GMAIL_USER`).
2. Go to **Security** → confirm **2-Step Verification** is **On**.
3. Go to **Security** → **2-Step Verification** → scroll to **App passwords**.
   - If you don't see "App passwords", your admin may need to allow them in Google Admin Console: **Security → API controls → App access control**.
4. Click **App passwords** → app: **Mail**, device: **Other** → name it `Aarvanta OS`.
5. Copy the **16-character password** (shown as `xxxx xxxx xxxx xxxx`).
6. Set environment variables:

```bash
GMAIL_USER=notifications@aarvanta.co
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   # 16 chars, spaces optional
EMAIL_FROM=notifications@aarvanta.co
EMAIL_REPLY_TO=notifications@aarvanta.co   # optional
CRON_SECRET=<your-cron-secret>
```

7. **Remove Resend DNS** from `aarvanta.co` if still present (MX, SPF, DKIM for Resend).
8. Redeploy on Vercel, then verify:

```bash
curl https://os.aarvanta.co/api/health
# channels.email: "live"
# emailSync: "ok"
```

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| `No password configured` | `GMAIL_APP_PASSWORD` empty or not deployed to Vercel |
| `emailSync: error` | Wrong app password, or IMAP disabled in Gmail settings |
| Inbound not appearing | Wait for cron (5 min) or `POST /api/email/sync` as admin |
| Outbound works, no inbound | Check cron + `CRON_SECRET` on Vercel |

## Production env checklist (Vercel)

- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `EMAIL_FROM`
- `CRON_SECRET`
- Remove old Resend vars: `RESEND_API_KEY`, `EMAIL_REPLY_TO` pointing to `*.resend.app`
