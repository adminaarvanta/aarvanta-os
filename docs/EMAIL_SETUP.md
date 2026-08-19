# Email setup — Gmail (recommended) and free alternatives

Aarvanta OS replaced Resend with **Gmail IMAP + SMTP** so email uses the Google Workspace mailbox **`admin@aarvanta.co`** without changing company MX records. `notifications@aarvanta.co` was deleted and is not used.

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
| **Gmail / Google Workspace** | Included with Workspace | IMAP sync | App password | Yes | **Aarvanta (chosen)** |
| Brevo (Sendinblue) | 300 emails/day | No real inbox sync | API | If send-only | Marketing blasts only |
| Mailgun | Trial then paid | Webhooks only | Yes | Often needs DNS | Developers, not inbox |
| Amazon SES | ~62k/mo from EC2 | No | Very cheap | DNS required | High volume, not inbox |
| Zoho Mail (free) | 1 user | IMAP | Yes | Replaces Google MX | New companies without Workspace |

**Recommendation:** Stay on **Gmail** — it is the only free option that gives true two-way inbox sync without disrupting `aarvanta.co` Google Workspace mail.

## Gmail App Password — step-by-step

You need this for `GMAIL_APP_PASSWORD` in Vercel and `.env.local`. SMTP always authenticates as **`admin@aarvanta.co`**. The app password must be created while signed in as that account.

### Prerequisites

1. Google Workspace account **`admin@aarvanta.co`**.
2. **2-Step Verification** enabled on `admin@aarvanta.co`.

### Steps

1. Sign in at [myaccount.google.com](https://myaccount.google.com) as **`admin@aarvanta.co`**.
2. Go to **Security** → confirm **2-Step Verification** is **On**.
3. Go to **Security** → **2-Step Verification** → scroll to **App passwords**.
   - If you don't see "App passwords", your admin may need to allow them in Google Admin Console: **Security → API controls → App access control**.
4. Click **App passwords** → app: **Mail**, device: **Other** → name it `Aarvanta OS`.
5. Copy the **16-character password** (shown as `xxxx xxxx xxxx xxxx`).
6. Set environment variables:

```bash
GMAIL_USER=admin@aarvanta.co
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   # 16 chars, created while signed in as admin@
EMAIL_FROM=admin@aarvanta.co
EMAIL_REPLY_TO=admin@aarvanta.co   # optional; code already replies as admin@
CRON_SECRET=<your-cron-secret>
```

7. **Remove Resend DNS** from `aarvanta.co` if still present (MX, SPF, DKIM for Resend).
8. Redeploy on Vercel, then verify:

```bash
curl https://os.aarvanta.co/api/health
# emailInbound.mailbox / from: "admin@aarvanta.co"
# emailSync: "ok"         → mailbox login works — this is the send check
```

If `emailSync` is `error`, outbound mail (affiliate set-password, team invites) is failing. Create a new App password **as admin@aarvanta.co** and update `GMAIL_APP_PASSWORD`. An app password from the deleted `notifications@` mailbox will not work.

Platform admins can also probe SMTP after a rotation:

```bash
# signed-in session cookie required
curl -X POST https://os.aarvanta.co/api/email/test-send
```

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| `No password configured` | `GMAIL_APP_PASSWORD` empty or not deployed to Vercel |
| `emailSync: error` | Google rejected login as `admin@aarvanta.co`. Create a new App password on that account (not the old notifications@ password). |
| `535 Username and Password not accepted` | `GMAIL_APP_PASSWORD` is wrong, revoked, still has quotes, or was issued for a different mailbox. 16 chars, no quotes. 2-Step Verification must stay on. |
| Inbound not appearing | Wait for cron (5 min) or `POST /api/email/sync` as admin |
| Outbound works, no inbound | Check cron + `CRON_SECRET` on Vercel |

## Production env checklist (Vercel)

- `GMAIL_APP_PASSWORD` (from **admin@aarvanta.co**)
- `GMAIL_USER=admin@aarvanta.co` (optional; code always sends as admin@)
- `EMAIL_FROM=admin@aarvanta.co` (optional; same)
- `CRON_SECRET`
- Remove old Resend vars: `RESEND_API_KEY`, `EMAIL_REPLY_TO` pointing to `*.resend.app`
