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

### 4. Test
**Outbound**
1. Sign in → `/calling` or `/voice`
2. Call a **verified** trial number (or leave trial)
3. Answer — AI should greet and converse two-way

**Inbound**
1. From your phone, dial `+1 716 703 2574`
2. AI receptionist should answer
3. Check `/voice` for call log + transcript note after hangup

### 5. Health
- `https://os.aarvanta.co/api/health` → Voice Relay item **ok**
- `https://YOUR-HOST/voice-relay/health` → `"openai": true`

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
- **Voice** — curated list, or paste a **custom Twilio/ElevenLabs voice ID**
- **Record calls** — opt-in (default off); optional spoken consent notice

Prefs persist on the workspace (`voiceTtsProvider`, `voiceId`, `voiceLanguage`, `voiceCustomId`, `callRecordingEnabled`, `callRecordingAnnounce`). Env vars remain the fallback when prefs are unset:

```bash
VOICE_RELAY_TTS_PROVIDER=ElevenLabs
VOICE_RELAY_TTS_VOICE=UgBBYS2sOqTuMpoF3BR0-flash_v2_5-0.95_0.65_0.8
# Skip ConversationRelay entirely (free of the $0.07/min fee)
VOICE_RELAY_BUDGET_MODE=true
```

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
