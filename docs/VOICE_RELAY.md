# Voice Relay (ConversationRelay) — EC2 sidecar

Two-way AI calling for Voice OS. Twilio ConversationRelay handles STT/TTS;
this FastAPI service on EC2 runs the LLM turn loop over `wss://`.

## Architecture

```
Caller ↔ Twilio ConversationRelay ↔ wss://EC2/…/ws (OpenAI gpt-4o-mini)
                ↕
         os.aarvanta.co (TwiML + status webhooks + Voice OS UI + transcript callback)
```

**Telephony number (v1):** `+1 716 703 2574`  
**App:** `https://os.aarvanta.co`

## Your checklist (manual)

### 1. Deploy relay on EC2
```bash
# On the EC2 host (after git pull of aarvanta-os):
sudo bash services/voice-relay/deploy/install-on-ec2.sh
sudo nano /opt/aarvanta/voice-relay/.env
```

Required `.env` on EC2:
```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
TWILIO_AUTH_TOKEN=...          # same as Vercel
VOICE_RELAY_WSS_URL=wss://YOUR-HOST/voice-relay/ws   # must match nginx + Vercel exactly
AARVANTA_VOICE_CALLBACK_URL=https://os.aarvanta.co/api/webhooks/voice-relay
VOICE_RELAY_CALLBACK_SECRET=generate-a-long-random-string
# Optional — defaults to …/api/voice/context derived from callback URL
# AARVANTA_VOICE_CONTEXT_URL=https://os.aarvanta.co/api/voice/context

# Reply naturalness (defaults shown)
VOICE_RELAY_MAX_TOKENS=160
VOICE_RELAY_MAX_CHARS=480
VOICE_RELAY_TEMPERATURE=0.65
```

After pulling code that updates `services/voice-relay/app.py`:
```bash
# On EC2
sudo bash services/voice-relay/deploy/install-on-ec2.sh   # or rsync + pip install
sudo systemctl restart voice-relay
curl https://YOUR-HOST/voice-relay/health
# Expect version >= 1.3.0, maxReplyTokens 160, contextConfigured true
```

Add nginx (path proxy or `voice.aarvanta.co`) from `deploy/nginx-voice-relay.conf`, then:
```bash
sudo nginx -t && sudo systemctl reload nginx
curl https://YOUR-HOST/voice-relay/health
```

### 2. Vercel env (Production) + redeploy
```bash
VOICE_RELAY_WSS_URL=wss://YOUR-HOST/voice-relay/ws
VOICE_RELAY_CALLBACK_SECRET=same-as-ec2
# Keep OFF for two-way human AI (budget mode = one-shot Polly, no ConversationRelay)
# VOICE_RELAY_BUDGET_MODE=true
VOICE_RELAY_TTS_PROVIDER=ElevenLabs
VOICE_RELAY_TTS_VOICE=EXAVITQu4vr4xnSDxMaL
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+17167032574
NEXT_PUBLIC_APP_URL=https://os.aarvanta.co
OPENAI_API_KEY=...
```

### 3. Twilio Console → Active number `+1 716 703 2574`
| Field | Value |
|-------|--------|
| **A call comes in** | `https://os.aarvanta.co/api/webhooks/twilio/twiml` · HTTP POST |
| **Call status changes** | `https://os.aarvanta.co/api/webhooks/twilio` · HTTP POST |
| Messaging (optional) | `https://os.aarvanta.co/api/webhooks/twilio` · HTTP POST |

Save. Enable **ConversationRelay** in Twilio if the Console asks you to onboard.

### 4. Knowledge Hub (company facts on calls)

At ConversationRelay `setup`, the EC2 relay POSTs to `/api/voice/context` (same `VOICE_RELAY_CALLBACK_SECRET`) and injects a short Knowledge Hub digest into the system prompt.

1. Ingest FAQs / product copy in **Knowledge Hub** (`/knowledge`) — hours, what you do, pricing-safe facts.
2. Confirm EC2 can reach `https://os.aarvanta.co/api/voice/context` (no IP allowlist blocking outbound HTTPS).
3. On a test call, ask a question that exists in Knowledge Hub — the agent should answer from those facts (not invent).

If no documents are ingested, the digest is empty and the agent falls back to the dialer briefing only.

### 4b. In-call calendar booking (relay ≥ 1.5.0)

The relay can call OpenAI tools that hit Aarvanta:

| Tool | API |
|------|-----|
| `get_availability` | `POST /api/voice/tools/calendar/availability` |
| `book_meeting` | `POST /api/voice/tools/calendar/book` |

Both require `X-Voice-Relay-Secret` (= `VOICE_RELAY_CALLBACK_SECRET`).

**Call now / campaign dials** must pass `contactId` + `sessionId` in TwiML custom params (manual outbound resolves CRM by phone). Without `contactId`, the agent will not book.

1. Connect Google Calendar at `/voice/calendar` (optional — otherwise demo Meet link).
2. Redeploy relay so `/health` shows `"version": "1.5.0"` and `"toolsEnabled": true`.
3. Settings → Call now (CRM contact with phone) → agree a time on the call.
4. Confirm under `/voice/meetings` (+ Google Calendar if connected).

### 5. Test (naturalness + knowledge)
**Outbound**
1. Sign in → `/calling` or `/voice`
2. In Voice settings, pick **ElevenLabs — Sarah** (or Rachel); do **not** enable budget mode
3. Call a **verified** trial number (or leave trial)
4. Answer — AI should greet warmly and answer in 2–4 sentences when asked to elaborate

**Inbound**
1. From your phone, dial `+1 716 703 2574`
2. Ask an open-ended question (“tell me more about what you do”) and a Knowledge Hub fact
3. Check `/voice` for call log + transcript note after hangup

### 6. Health
- `https://os.aarvanta.co/api/health` → Voice Relay item **ok**
- `https://YOUR-HOST/voice-relay/health` → `"openai": true`, `"version": "1.5.0"`, `"contextConfigured": true`, `"toolsEnabled": true`

## Voiceover (TTS) & cost

There is **no fully free** two-way PSTN AI on Twilio. Conversation Relay is **~$0.07/min** plus normal call minutes.

| Mode | Env / UI | Two-way AI? | Approx. extra |
|------|----------|-------------|----------------|
| **Budget (cheapest)** | `VOICE_RELAY_BUDGET_MODE=true` | No — one-shot Polly `<Say>` | Call minutes only |
| **Amazon / Google / ElevenLabs** | Voice OS → Voice configuration (or env) | Yes | Relay $0.07/min + call minutes |

### Voice configuration (Voice OS UI)

In **`/voice`** (and compact on **`/calling`**), operators can set:

- **Provider** — ElevenLabs, Google, or Amazon Polly
- **Language** — e.g. `en-US`, `en-GB`, `hi-IN` (passed to ConversationRelay + relay LLM prompt)
- **Voice** — curated list (default **Sarah**), or paste a **custom Twilio/ElevenLabs voice ID**. Prefer Sarah/Rachel for natural reception; Mark (fast) uses `flash_v2_5` (lower latency, flatter).
- **Record calls** — opt-in (default off); optional spoken consent notice

Prefs persist on the workspace (`voiceTtsProvider`, `voiceId`, `voiceLanguage`, `voiceCustomId`, `callRecordingEnabled`, `callRecordingAnnounce`). Env vars remain the fallback when prefs are unset:

```bash
VOICE_RELAY_TTS_PROVIDER=ElevenLabs
VOICE_RELAY_TTS_VOICE=EXAVITQu4vr4xnSDxMaL
# Skip ConversationRelay entirely (free of the $0.07/min fee) — robotic one-shot only
# VOICE_RELAY_BUDGET_MODE=true
```

### Reply style knobs (EC2)

Controlled in `/opt/aarvanta/voice-relay/.env` (restart `voice-relay` after changes):

| Env | Default | Effect |
|-----|---------|--------|
| `VOICE_RELAY_MAX_TOKENS` | `160` | LLM output budget (~2–4 sentences) |
| `VOICE_RELAY_MAX_CHARS` | `480` | Hard spoken-length cap |
| `VOICE_RELAY_TEMPERATURE` | `0.65` | Higher = more natural variation |
| `VOICE_AGENT_SYSTEM_PROMPT` | warm receptionist | Override full system prompt |

### Call recording

When **Record calls** is enabled in Voice OS:

1. Outbound: Twilio `Record=true` + dual channel + `RecordingStatusCallback` → `/api/webhooks/twilio/recording`
2. Inbound: on `in-progress`, app starts a recording via Twilio REST
3. Completed recordings attach `recordingSid` / proxy URL to the call timeline event
4. Playback: authenticated `GET /api/calling/recordings/{RecordingSid}` (inbox / Voice OS timeline)

Consent: when announce is on, TwiML welcome includes: “This call may be recorded for quality and training purposes.”

Retention: Twilio’s default for the recording media; delete via Twilio Console if needed (no automated GDPR purge in MVP).

## Fallback

If `VOICE_RELAY_WSS_URL` is unset (or budget mode), Voice OS uses **one-shot `<Say>` TTS** (no two-way AI).

## Desktop note

EC2 SSH/host details live in your local onboarding automation project. This cloud agent cannot access your Desktop — use that host when installing.
