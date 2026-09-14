# Google Calendar connect

Voice OS availability and bookings use each member’s own calendar (`/voice/calendar`).

Customers hitting **Access blocked: aarvanta.co has not completed the Google verification process** / `403: access_denied` are blocked by Google’s OAuth consent screen. Aarvanta does **not** send people into that Google screen by default.

## What customers do today (works without Google review)

1. Open `/voice/calendar`
2. Click **Connect calendar**
3. Bookings are emailed to their account address as `.ics` invites. Google Calendar adds those automatically.

Optional: paste a **Secret address in iCal format** on the same page to sync live busy times.

## Google sign-in (operators only, after Cloud setup)

Google sign-in stays off until you set:

```
GOOGLE_CALENDAR_OAUTH_PUBLIC=true
```

Do that only after:

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials/consent) → OAuth consent screen for `GOOGLE_CALENDAR_CLIENT_ID` (or the SSO Google client)
2. Publishing status → **In production**
3. Redirect URI: `https://YOUR_DOMAIN/api/integrations/google-calendar/oauth/callback`
4. Calendar API enabled
5. Sensitive-scope verification for `calendar.events` and `calendar.freebusy` (or accept the unverified-app warning / 100-user cap)

Until then, leave `GOOGLE_CALENDAR_OAUTH_PUBLIC` unset. Hitting `/api/integrations/google-calendar/oauth/start` redirects back to the calendar page instead of Google’s 403.

## Env

```
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=https://your-domain.com
# GOOGLE_CALENDAR_OAUTH_PUBLIC=true
```

Falls back to `SSO_GOOGLE_CLIENT_ID` / `SSO_GOOGLE_CLIENT_SECRET` when the calendar-specific vars are unset.
