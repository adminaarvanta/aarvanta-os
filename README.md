# Aarvanta OS — Module 1: Communication Hub

Multi-tenant communication layer for Aarvanta OS: unified inbox, conversation timeline, internal notes, tags, AI summaries, and sentiment analysis.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000/inbox](http://localhost:3000/inbox).

Demo data loads automatically (no Firebase required).

## Module 1 features (MVP)

| Feature | Status |
|--------|--------|
| Unified inbox | ✅ |
| Conversation timeline (messages, calls, email, notes, meetings) | ✅ |
| Internal notes | ✅ |
| Tags (Hot Lead, VIP, Follow Up, Support, Lost) | ✅ |
| AI summaries | ✅ (OpenAI or heuristic fallback) |
| Sentiment (positive / neutral / frustrated / urgent) | ✅ |
| Channels UI (WhatsApp, email, voice, SMS, website chat) | ✅ UI + reply |
| WhatsApp / Twilio webhooks | 🔌 stubs ready |
| Firebase persistence | 🔌 wiring ready |
| Auth + RBAC | 📋 next phase |

## Environment

Copy `.env.example` to `.env.local` and set keys as needed.

## API

- `GET /api/conversations`
- `GET|PATCH /api/conversations/:id` — tags
- `POST /api/conversations/:id/messages`
- `POST /api/conversations/:id/notes`
- `POST /api/conversations/:id/summarize`
- `GET|POST /api/webhooks/whatsapp`
- `POST /api/webhooks/twilio`

## Stack

Next.js 16 · TypeScript · Tailwind CSS · Firebase (optional) · OpenAI (optional)
