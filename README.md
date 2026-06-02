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

### 8. Twilio SMS

1. [twilio.com/console](https://www.twilio.com/console) → copy Account SID + Auth Token
2. Buy an SMS-capable number → `TWILIO_PHONE_NUMBER`
3. **Phone Numbers → your number → Messaging**:
   - Webhook: `https://YOUR-DOMAIN/api/webhooks/twilio` (HTTP POST)
4. Trial accounts: verify recipient numbers first

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run seed:firestore` | Add a test conversation to Firestore |
| `firebase deploy --only firestore:indexes` | Deploy Firestore indexes |


| Feature | Demo | Production |
|--------|------|------------|
| Unified inbox | ✅ | ✅ |
| Conversation timeline | ✅ | ✅ |
| Internal notes | ✅ | ✅ |
| Tags | ✅ | ✅ |
| AI summaries | ✅ | ✅ |
| Sentiment | ✅ | ✅ |
| Reply UI | ✅ local only | ✅ + WhatsApp/SMS send |
| WhatsApp / Twilio webhooks | 🔌 log only | ✅ validated + persisted |
| Firebase persistence | in-memory | ✅ Firestore |
| Auth | open | ✅ session login |

## API

- `GET /api/health`
- `POST /api/auth/login` · `POST /api/auth/logout`
- `GET /api/conversations`
- `GET|PATCH /api/conversations/:id` — tags
- `POST /api/conversations/:id/messages`
- `POST /api/conversations/:id/notes`
- `POST /api/conversations/:id/summarize`
- `GET|POST /api/webhooks/whatsapp`
- `POST /api/webhooks/twilio`

## Stack

Next.js 16 · TypeScript · Tailwind CSS · Firestore · OpenAI (optional)
