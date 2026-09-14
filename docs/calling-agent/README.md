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
| `/voice/calendar` | Per-user calendar connect (email invites by default; optional iCal / Google OAuth) + sync, team status, slot picker |
| `/voice/history` | Conversation replay |
| `/voice/insights` | Funnel + performance + insights |
| `/voice/dialer` | Manual dialer (CRM person picker + Voice Agent + Call now / Schedule) |
| `/voice/settings` | Voice TTS / recording prefs + primary Voice Agent |

`/calling` redirects to `/voice/settings`.

## Env

- Twilio + `VOICE_RELAY_*` (see `docs/VOICE_RELAY.md`)
- `ELEVENLABS_API_KEY` — Instant Voice Clone upload + live cloned TTS (optional; catalog voices work without it)
- `CRON_SECRET` — protects `/api/cron/call-campaigns` and `/api/cron/meeting-reminders`
- Starting or resuming a campaign places the first in-hours batch immediately
- Vercel Hobby can only run crons once a day, so leftover queue is swept at 14:00 UTC (US/EU hours) and 05:00 UTC (South Asia hours). Upgrade to Pro for minute cadence.
- Deploy Firestore indexes (`firebase deploy --only firestore:indexes`) so `call_queue` due-item queries succeed
- `GOOGLE_CALENDAR_CLIENT_ID` / `GOOGLE_CALENDAR_CLIENT_SECRET` (or SSO Google client vars) for FreeBusy + event create after Google verification. Default Connect emails `.ics` invites to the member’s mailbox (no Google screen). Optional secret iCal link for live busy times. See `docs/GOOGLE_CALENDAR.md`.
- `NEXT_PUBLIC_APP_URL` — OAuth redirect + TwiML

## Demo

With `APP_MODE` unset (demo), seeded campaign/queue/sessions/meetings load from memory. Any **active** workspace member can connect their own calendar from `/voice/calendar` or `/voice/settings`. Demo mode simulates the connection and local sync. Production **Connect calendar** stores the member’s email and emails bookings as `.ics` invites (Google Calendar adds those automatically). Live FreeBusy still needs a secret iCal link or published Google OAuth (`GOOGLE_CALENDAR_OAUTH_PUBLIC=true`). Suspended members cannot connect. Calendar booking uses synthetic slots when no live calendar is connected.
