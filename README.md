# Aarvanta OS — Module 1: Communication Hub

Multi-tenant communication layer for Aarvanta OS: unified inbox, conversation timeline, internal notes, tags, AI summaries, and sentiment analysis.

## Run locally (demo mode)

Demo mode uses in-memory data — no Firebase or login required.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000/inbox](http://localhost:3000/inbox).

## Production mode (Module 1)

Set `APP_MODE=production` to enable:

- **Firestore persistence** (replaces in-memory store)
- **Session auth** (login required for inbox + API)
- **Webhook signature validation** (WhatsApp + Twilio)
- **Outbound delivery** (WhatsApp + SMS when configured)
- **Health check** at `/api/health`

### 1. Firebase setup

1. Create a Firebase project
2. Enable Firestore
3. Create a service account and download credentials
4. Deploy the composite index:

```bash
firebase deploy --only firestore:indexes
```

(`firestore.indexes.json` is included in this repo.)

### 2. Environment variables

Copy `.env.example` to `.env.local` (or set in Vercel/hosting):

```bash
APP_MODE=production

AUTH_SECRET=your-long-random-secret
AUTH_EMAIL=agent@yourcompany.com
AUTH_PASSWORD=your-secure-password

TENANT_ID=tenant_prod
WORKSPACE_ID=ws_prod
COMPANY_ID=company_prod

NEXT_PUBLIC_APP_URL=https://your-domain.com

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### 3. Run / deploy

```bash
npm run build
npm start
```

Sign in at `/login`, then open `/inbox`.

### 4. Register webhooks

| Provider | URL | Notes |
|----------|-----|-------|
| WhatsApp | `GET/POST /api/webhooks/whatsapp` | Set verify token + app secret |
| Twilio | `POST /api/webhooks/twilio` | Set `NEXT_PUBLIC_APP_URL` for signature validation |

Inbound messages create or update conversations in Firestore automatically.

### 5. Seed test data

```bash
npm run seed:firestore
```

### 6. Deploy to Vercel

1. Push this repo to GitHub (`adminaarvanta/aarvanta-os`)
2. Go to [vercel.com/new](https://vercel.com/new) → Import the repo
3. Add **all** env vars from `.env.example` (Production environment)
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g. `https://aarvanta-os.vercel.app`)
5. Deploy → verify `https://YOUR-URL/api/health`
6. Sign in at `/login`

### 7. WhatsApp Cloud API

1. [developers.facebook.com](https://developers.facebook.com) → Create Business app → Add **WhatsApp**
2. Copy from **WhatsApp → API Setup**:
   - Phone number ID → `WHATSAPP_PHONE_NUMBER_ID`
   - Access token → `WHATSAPP_ACCESS_TOKEN`
3. From **App Settings → Basic**:
   - App Secret → `WHATSAPP_APP_SECRET`
4. Invent a verify token → `WHATSAPP_VERIFY_TOKEN`
5. **WhatsApp → Configuration → Webhook**:
   - Callback: `https://YOUR-DOMAIN/api/webhooks/whatsapp`
   - Verify token: same as env
   - Subscribe to **messages**
6. Add test recipient numbers in Meta (dev mode)

### 8. Twilio SMS & Voice

1. [twilio.com/console](https://www.twilio.com/console) → copy Account SID + Auth Token
2. Buy an SMS-capable number → `TWILIO_PHONE_NUMBER`
3. **Phone Numbers → your number → Messaging**:
   - Webhook: `https://YOUR-DOMAIN/api/webhooks/twilio` (HTTP POST)
4. **Voice**: same webhook URL for call status; outbound calls use `/api/webhooks/twilio/twiml`
5. Trial accounts: verify recipient numbers first

### 9. Email (Resend)

1. [resend.com](https://resend.com) → create an API key with **Full access** (send-only keys cannot load inbound email bodies) → `RESEND_API_KEY`
2. Verify your domain in Resend and enable **Receiving** (add the MX record Resend provides)
3. Set `EMAIL_FROM` to an address on that verified domain (e.g. `notifications@yourdomain.com`)
4. Set `EMAIL_REPLY_TO` to an address on the **same verified receiving domain** (e.g. `reply@yourdomain.com`). Gmail replies go to this address — if it is on an unverified subdomain, replies will never reach Resend. When unset, defaults to `reply@<your EMAIL_FROM domain>`.
5. **Resend → Webhooks** → `https://YOUR-DOMAIN/api/webhooks/email` (event: `email.received` only)
6. Verify: `GET /api/health` → `emailInbound.replyTo`, `emailInbound.receivingStatus: "ok"`

**Common pitfalls:**
- Reply-To on a subdomain without Resend receiving enabled (use the root verified domain instead)
- Send-only API key (inbound messages fail body fetch; webhook skips saving until fixed)
- Webhook subscribed to `email.sent` / `email.delivered` instead of `email.received`

### 10. Website chat

- Visitor UI: `/chat` (link in sidebar)
- API: `POST /api/chat/session`, `POST|GET /api/chat/messages`
- No external provider — works out of the box

### 11. AI summaries & sentiment (OpenAI)

1. Get an API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. Add to `.env.local`:
   ```bash
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
   ```
3. Restart the dev server
4. Verify: `GET /api/health` → `ai.status` should be `"live"`

**Behavior:**
- Summaries and sentiment use the OpenAI Chat Completions API (JSON mode).
- **Automatic:** after each inbound message (webhook or website chat), the conversation is re-analyzed in the background.
- **Manual:** use “Refresh summary & sentiment” in the inbox AI panel, or `POST /api/conversations/:id/summarize`.

Set `AI_AUTO_SUMMARIZE=false` to disable automatic updates. In demo mode without a key, keyword heuristics are used; in production, missing `OPENAI_API_KEY` returns `503 AI_NOT_CONFIGURED`.

> **Note:** Cursor’s API is for coding agents (repo tasks), not inbox summarization. Use OpenAI for Communication Hub AI.

## All channels (dev)

With `CHANNELS_SIMULATE=true` or `APP_MODE=demo`, external delivery is simulated (logged, not sent).

Test all inbound channels locally:

```bash
npm run dev
npm run simulate:channels
```

Open `/inbox` — you should see WhatsApp, SMS, voice, email, and website chat conversations.

Check channel status: `GET /api/health` → `channels` object (`live` | `simulate` | `not_configured`) and `ai` object (`live` | `heuristic` | `disabled`).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run seed:firestore` | Add a test conversation to Firestore |
| `npm run simulate:channels` | Simulate inbound on all 5 channels |
| `firebase deploy --only firestore:indexes` | Deploy Firestore indexes |

## Module 1 features

| Channel | Inbound | Outbound | Provider |
|---------|---------|----------|----------|
| WhatsApp | ✅ webhook | ✅ | Meta Cloud API |
| SMS | ✅ webhook | ✅ | Twilio |
| Voice | ✅ webhook | ✅ call + TTS | Twilio |
| Email | ✅ webhook | ✅ | Resend |
| Website chat | ✅ `/chat` | ✅ inbox reply | Built-in |

## API

- `GET /api/health` — includes per-channel status
- `POST /api/auth/login` · `POST /api/auth/logout`
- `GET /api/conversations`
- `GET|PATCH /api/conversations/:id` — tags
- `POST /api/conversations/:id/messages`
- `POST /api/conversations/:id/notes`
- `POST /api/conversations/:id/summarize`
- `GET|POST /api/webhooks/whatsapp`
- `POST /api/webhooks/twilio` — SMS + voice status
- `GET /api/webhooks/twilio/twiml` — voice message TwiML
- `POST /api/webhooks/email` — Resend inbound
- `POST /api/chat/session` · `POST|GET /api/chat/messages`

## Stack

Next.js 16 · TypeScript · Tailwind CSS · Firestore · OpenAI (optional)
