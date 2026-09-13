# Google Calendar connect

Voice OS availability and bookings use each member’s own Google Calendar (`/voice/calendar`).

Customers hitting **Access blocked: aarvanta.co has not completed the Google verification process** / `403: access_denied` are blocked by Google’s OAuth consent screen — not by Aarvanta code. That happens when the Cloud project is in **Testing** (only listed testers can sign in) or the app is unverified and Google is refusing new users.

## What customers can do today (no Google review)

On `/voice/calendar`, paste the calendar’s **Secret address in iCal format**:

1. Open [Google Calendar](https://calendar.google.com) on the web  
2. Settings (gear) → **Settings**  
3. Select the calendar on the left  
4. **Integrate calendar** → copy **Secret address in iCal format**  
5. Paste it into Aarvanta and click **Connect link**

That URL is a secret (anyone with it can read the calendar). Aarvanta stores it per user and uses it for Free/Busy. Bookings are emailed as a proper `.ics` invite to the connected mailbox.

## What operators should do in Google Cloud (so “Continue with Google” works)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials/consent) → the OAuth consent screen used by `GOOGLE_CALENDAR_CLIENT_ID` (or the SSO Google client)  
2. User type **External**  
3. Publishing status → **In production** (saves immediately; this is not the same as scope verification)  
4. Add authorized redirect URI:  
   `https://YOUR_DOMAIN/api/integrations/google-calendar/oauth/callback`  
5. Enable the **Google Calendar API** on the same project  
6. Submit **sensitive scope verification** for `calendar.events` and `calendar.freebusy` when you are ready to remove the “unverified app” warning and the 100-user cap  

Until verification is approved, keep the iCal-link path available. Do not leave the consent screen in **Testing** if real customers need Google sign-in — they will always get `access_denied`.

## Env

```
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Falls back to `SSO_GOOGLE_CLIENT_ID` / `SSO_GOOGLE_CLIENT_SECRET` when the calendar-specific vars are unset.
