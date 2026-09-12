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
# Custom clones (same key as Vercel). Leave unset to keep catalog TTS only.
ELEVENLABS_API_KEY=
# Optional — defaults to …/api/voice/context derived from callback URL
# AARVANTA_VOICE_CONTEXT_URL=https://os.aarvanta.co/api/voice/context

# Reply naturalness (defaults shown)
VOICE_RELAY_MAX_TOKENS=160
VOICE_RELAY_MAX_CHARS=480
VOICE_RELAY_TEMPERATURE=0.72
```

After pulling code that updates `services/voice-relay/app.py`:
```bash
# On EC2
sudo bash services/voice-relay/deploy/install-on-ec2.sh   # or rsync + pip install
sudo systemctl restart voice-relay
curl https://YOUR-HOST/voice-relay/health
# Expect version >= 1.9.4. clonedTts / premiumTts are true when ELEVENLABS_API_KEY is set
# AND /tts is publicly reachable. Catalog Jessica (Turbo 2.5) still works without the key.
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
# Custom Voice Agent clones (upload on /voice/agents/:id/flow)
ELEVENLABS_API_KEY=
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

If no documents are ingested, or the call only has a generic goal like “Book Meetings”, the digest stays empty (`knowledgeMode: bare`) and the agent must not invent a product dump.

### 4b. In-call calendar booking (relay ≥ 1.9.4)

The relay can call OpenAI tools that hit Aarvanta, but **not on the opening turns**. Calendar tools stay locked until the caller asks for a time (not merely says “meeting”). `get_availability` is fetched at most once per call; the spoken hold is a single “One sec.” — never “checking the calendar” on a loop.

| Tool | API |
|------|-----|
| `get_availability` | `POST /api/voice/tools/calendar/availability` |
| `book_meeting` | `POST /api/voice/tools/calendar/book` |

Both require `X-Voice-Relay-Secret` (= `VOICE_RELAY_CALLBACK_SECRET`).

**Call now / campaign dials** must pass `contactId` + `sessionId` in TwiML custom params (manual outbound resolves CRM by phone). Without `contactId`, the agent will not book.

1. Each active user connects their own Google Calendar at `/voice/calendar` (optional — otherwise demo Meet link). Sync writes availability and bookings to that user’s calendar.
2. Redeploy relay so `/health` shows `"version": "1.9.4"` and `"toolsEnabled": true`.
3. Settings → Call now (CRM contact with phone) → agree a time on the call.
4. Confirm under `/voice/meetings` (+ Google Calendar if connected).

### 5. Test (naturalness + knowledge)
**Outbound**
1. Sign in → `/calling` or `/voice`
2. In Voice settings, pick **ElevenLabs — Jessica** (or Sarah / Lily); do **not** enable budget mode
3. Call a **verified** trial number (or leave trial)
4. Answer — you should hear an identity greeting in about a second (“Hi … this is Ava at Aarvanta. Did I catch you at an alright time?”). The agent must **not** jump to booking a call.

**Inbound**
1. From your phone, dial `+1 716 703 2574`
2. Ask an open-ended question (“tell me more about what you do”) and a Knowledge Hub fact
3. Check `/voice` for call log + transcript note after hangup

### 6. Health
- `https://os.aarvanta.co/api/health` → Voice Relay item **ok**; `voiceRelay.elevenLabsApiKeyConfigured` is true only when `ELEVENLABS_API_KEY` is set on Vercel (required for clones, preview, and premium multilingual v2; catalog Jessica Turbo still works without it)
- `https://YOUR-HOST/voice-relay/health` → `"openai": true`, `"version": "1.9.4"`, `"contextConfigured": true`, `"toolsEnabled": true`, `"premiumTts": true` when `ELEVENLABS_API_KEY` is set on EC2

## Voiceover (TTS) & cost

There is **no fully free** two-way PSTN AI on Twilio. Conversation Relay is **~$0.07/min** plus normal call minutes.

### Why the live voice sounded robotic

Twilio ConversationRelay defaults ElevenLabs to **Flash 2.5** when the TwiML `voice` is a bare id (we used to send Rachel `21m00Tcm4TlvDq8ikWAM` with no model suffix). Flash is fast and flat. ConversationRelay’s highest-quality model is **Turbo 2.5**, plus speed / stability / similarity:

```
{voiceId}-turbo_v2_5-0.95_0.38_0.82
```

Lower stability (~0.38) is more expressive; 0.8+ is monotone. `elevenlabsTextNormalization="on"` stays on.

Paid **ElevenLabs API** (`ELEVENLABS_API_KEY` on Vercel + EC2) is a step above that: later turns synthesize `eleven_multilingual_v2` and ConversationRelay `play`s the MP3. That model is not available inside ConversationRelay itself. Greeting still uses catalog Turbo so the line is never silent.

Recommended catalog voices: **Jessica** (`cgSgspJ2msm6clMCkdW9`), Sarah, Lily, Matilda, Alice. Rachel is legacy. Mark flash is the low-latency / flatter option.

After deploy, **restart the EC2 relay** so `/voice-relay/health` shows `version` ≥ **1.9.4**. TwiML-only changes (Turbo suffix) go live with the Vercel deploy even before the restart.

| Mode | Env / UI | Two-way AI? | Approx. extra |
|------|----------|-------------|----------------|
| **Budget (cheapest)** | `VOICE_RELAY_BUDGET_MODE=true` | No — one-shot Polly `<Say>` | Call minutes only |
| **Amazon / Google / ElevenLabs** | Voice OS → Voice configuration (or env) | Yes | Relay $0.07/min + call minutes |
| **Custom clone / premium API TTS** | Voice Agents clone, or catalog + `ELEVENLABS_API_KEY` | Yes | Relay fee **plus** ElevenLabs TTS characters (`eleven_multilingual_v2`) |

### Custom Voice Agent clone

Twilio ConversationRelay can only speak **catalog** ElevenLabs/Google/Amazon voices. A clone from uploaded audio lives in the Aarvanta ElevenLabs account, so the EC2 relay synthesizes MP3s and sends ConversationRelay `{ type: "play", source }`.

1. Create a **new** Voice Agent at **`/voice/agents`** (do not clone onto the default Ava persona).
2. On that agent’s page, upload **or record** 1–2 minutes of clean speech (MP3 192kbps preferred), confirm consent, and clone.
3. Leave **Use this agent as the default for Dialer, inbound, and scheduled calls** checked (or later click **Set as primary** / pick it under Voice settings → Primary Voice Agent). Campaigns can still choose a different agent.
4. Set `ELEVENLABS_API_KEY` on **Vercel** (clone + in-app preview) **and** EC2 `/opt/aarvanta/voice-relay/.env` (live call TTS). Same key.
5. Redeploy the relay (`version` ≥ **1.9.4**, `premiumTts: true`). Nginx must expose `/tts/` (path-based `/voice-relay/tts/` already works via the existing prefix proxy). **Every call** uses Twilio `welcomeGreeting` for the first sentence (catalog Turbo 2.5, ~1s) so the line is never silent. The relay does not greet a second time (`skipOpening`). Later turns use ElevenLabs `eleven_multilingual_v2` play audio when the API key is set (clone or catalog `ttsVoiceId`).
6. Demo mode (`APP_MODE` unset) stores a simulated clone for the UI; live cloned speech still needs production + the API key. The primary agent’s **call playbook** is used on Dialer/inbound even in demo.

The playbook on the agent page is coaching notes for each part of the call (greet, qualify, book, hang up). Example lines stay in the editor only — they are **not** sent to the live-call model.

Agents without a ready clone keep the workspace Voice settings (Jessica/Sarah/etc.). Live calls resolve the agent in this order: explicit Dialer/campaign id → workspace primary → first agent with a custom clone → first agent.

### Voice configuration (Voice OS UI)

In **`/voice`** (and compact on **`/calling`**), operators can set:

- **Provider** — ElevenLabs, Google, or Amazon Polly
- **Language** — e.g. `en-US`, `en-GB`, `hi-IN`. ConversationRelay gets the **workspace** locale (not the agent picker). `multi` (auto-detect) is only sent with ElevenLabs; Amazon/Google fall back to `en-US` so the session does not drop.
- **Voice** — curated list (default **Jessica**), or paste a **custom Twilio/ElevenLabs voice ID**. Jessica / Sarah / Lily / Matilda / Alice are the human catalog picks. Bare IDs are sent as `{id}-turbo_v2_5-0.95_0.38_0.82` (Twilio’s highest-quality ConversationRelay model + expressive stability). Mark (fast) stays on `flash_v2_5`. Rachel is legacy.
- **Primary Voice Agent** — persona used for inbound, Dialer, and scheduled calls when none is specified. A custom clone on that agent is what speaks on live calls.
- **Record calls** — opt-in (default off); optional spoken consent notice

Prefs persist on the workspace (`voiceTtsProvider`, `voiceId`, `voiceLanguage`, `voiceCustomId`, `voicePrimaryAgentId`, `callRecordingEnabled`, `callRecordingAnnounce`). Env vars remain the fallback when prefs are unset:

```bash
VOICE_RELAY_TTS_PROVIDER=ElevenLabs
VOICE_RELAY_TTS_VOICE=cgSgspJ2msm6clMCkdW9
# Skip ConversationRelay entirely (free of the $0.07/min fee) — robotic one-shot only
# VOICE_RELAY_BUDGET_MODE=true
```

### Reply style knobs (EC2)

Controlled in `/opt/aarvanta/voice-relay/.env` (restart `voice-relay` after changes):

| Env | Default | Effect |
|-----|---------|--------|
| `VOICE_RELAY_MAX_TOKENS` | `160` | Short turns (~1–2 sentences) |
| `VOICE_RELAY_MAX_CHARS` | `380` | Hard spoken-length cap |
| `VOICE_RELAY_TEMPERATURE` | `0.72` | Lower = flatter / more robotic |
| `VOICE_RELAY_FREQUENCY_PENALTY` | `0.35` | Reduces repeated phrases |
| `VOICE_RELAY_PRESENCE_PENALTY` | `0.2` | Encourages moving the call forward |
| `VOICE_RELAY_CLONE_TTS_TIMEOUT` | `10` | Seconds before premium/clone synth falls back to catalog |
| `ELEVENLABS_TTS_MODEL` | `eleven_multilingual_v2` | Paid API model for `/tts` play (clones + catalog when key is set) |
| `VOICE_RELAY_PREMIUM_TTS` | `true` | When false, only clones use the ElevenLabs API; catalog stays on ConversationRelay Turbo |
| `VOICE_AGENT_SYSTEM_PROMPT` | anti-bluff concise | Override full system prompt (leave unset) |

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
