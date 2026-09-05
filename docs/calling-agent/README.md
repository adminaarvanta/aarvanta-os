# AI Automated Calling Agent (Voice OS)

Outbound AI calling campaigns live entirely inside **Voice OS** (`/voice`).

## Surfaces

| Route | Purpose |
|-------|---------|
| `/voice` | Mission control dashboard |
| `/voice/agents` | Personas — voice clone, primary agent, and call playbook (coaching notes, not a teleprompter) |
| `/voice/campaigns` | Campaign list + 6-step wizard |
| `/voice/live` | Live call monitor |
| `/voice/queue` | Kanban queue |
| `/voice/meetings` | Booked meetings |
| `/voice/calendar` | Slot picker + Google Calendar connect |
| `/voice/history` | Conversation replay |
| `/voice/insights` | Funnel + performance + insights |
| `/voice/dialer` | Manual dialer (CRM person picker + Voice Agent + Call now / Schedule) |
| `/voice/settings` | Voice TTS / recording prefs + primary Voice Agent |

`/calling` redirects to `/voice/settings`.

## Env

- Twilio + `VOICE_RELAY_*` (see `docs/VOICE_RELAY.md`)
- `ELEVENLABS_API_KEY` — Instant Voice Clone upload + live cloned TTS (optional; catalog voices work without it)
- `CRON_SECRET` — protects `/api/cron/call-campaigns` (every minute) and `/api/cron/meeting-reminders`
- `GOOGLE_CALENDAR_CLIENT_ID` / `GOOGLE_CALENDAR_CLIENT_SECRET` (or SSO Google client vars) for FreeBusy + event create
- `NEXT_PUBLIC_APP_URL` — OAuth redirect + TwiML

## Demo

With `APP_MODE` unset (demo), seeded campaign/queue/sessions/meetings load from memory. Calendar booking uses synthetic slots when Google is not connected.
