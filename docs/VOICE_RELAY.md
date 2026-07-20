# Voice Relay (ConversationRelay) — EC2 sidecar

Two-way AI calling for Voice OS. Twilio ConversationRelay handles STT/TTS;
this FastAPI service on EC2 runs the LLM turn loop over `wss://`.

## Architecture

```
Caller ↔ Twilio ConversationRelay ↔ wss://EC2/voice-relay/ws (OpenAI)
                ↕
         os.aarvanta.co (TwiML + status webhooks + Voice OS UI)
```

Co-locate with `aarvanta_onboarding_automation` on the existing EC2 (same nginx TLS).

## Deploy on EC2

1. Copy `services/voice-relay` to the box (git clone of aarvanta-os or scp).
2. Run:
   ```bash
   sudo bash services/voice-relay/deploy/install-on-ec2.sh
   ```
3. Edit `/opt/aarvanta/voice-relay/.env`:
   - `OPENAI_API_KEY`
   - `TWILIO_AUTH_TOKEN`
   - `VOICE_RELAY_WSS_URL=wss://onboarding.aarvanta.co/voice-relay/ws`  
     (must match nginx path + TwiML / Vercel env **exactly**)
4. Add the nginx snippet from `deploy/nginx-voice-relay.conf` to the existing host, then `nginx -t && systemctl reload nginx`.
5. Check: `curl https://onboarding.aarvanta.co/voice-relay/health`

## Vercel (Aarvanta OS)

```
VOICE_RELAY_WSS_URL=wss://onboarding.aarvanta.co/voice-relay/ws
```

Optional: if unset, OS derives `wss://<host>/voice-relay/ws` from `ONBOARDING_SIDECAR_URL`.

When set, outbound/inbound TwiML uses `<Connect><ConversationRelay/></Connect>` instead of one-shot `<Say>`.

## Twilio Console

Keep Voice **Call status changes** → `https://os.aarvanta.co/api/webhooks/twilio`.  
**A call comes in** can stay on `/api/webhooks/twilio/twiml` (OS returns ConversationRelay TwiML when relay is configured).

## Desktop note

EC2 host/SSH details live in the local **onboarding automation** project. This cloud agent cannot read your Desktop — use that project's host/IP when installing, then set the public `wss://` URL above.
