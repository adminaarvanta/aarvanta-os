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

## Voiceover (TTS)

ConversationRelay speaks with **ElevenLabs** by default (human-like telephony voice via Twilio — no separate ElevenLabs key). Alternatives on the same TwiML path: `Amazon` / `Google`.

Optional Vercel env:
```bash
VOICE_RELAY_TTS_PROVIDER=ElevenLabs
VOICE_RELAY_TTS_VOICE=UgBBYS2sOqTuMpoF3BR0-flash_v2_5-0.95_0.65_0.8
VOICE_RELAY_ELEVENLABS_TEXT_NORM=on
```

## Fallback

If `VOICE_RELAY_WSS_URL` is unset, Voice OS still works with **one-shot `<Say>` TTS** (no two-way AI).

## Desktop note

EC2 SSH/host details live in your local onboarding automation project. This cloud agent cannot access your Desktop — use that host when installing.
