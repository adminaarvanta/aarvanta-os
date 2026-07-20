"""
Aarvanta Voice Relay — Twilio ConversationRelay WebSocket sidecar.

Deploy on the same EC2 as aarvanta_onboarding_automation (FastAPI).
Twilio connects with wss:// and streams caller speech as text prompts;
we reply with OpenAI chat tokens that ConversationRelay speaks aloud.

Protocol (Twilio → us): setup | prompt | interrupt | dtmf | error
Protocol (us → Twilio): text {token, last} | end
"""

from __future__ import annotations

import hashlib
import hmac
import base64
import json
import logging
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, PlainTextResponse
from openai import OpenAI

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("voice-relay")

PORT = int(os.getenv("PORT", "8090"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
# Exact public wss URL used in TwiML <ConversationRelay url="..."> (for signature check)
VOICE_RELAY_WSS_URL = os.getenv("VOICE_RELAY_WSS_URL", "").strip()
SYSTEM_PROMPT = os.getenv(
    "VOICE_AGENT_SYSTEM_PROMPT",
    (
        "You are Aarvanta Voice OS, a concise phone assistant for a business OS. "
        "Keep replies short (1–3 spoken sentences). Be helpful, professional, and clear. "
        "If asked to transfer to a human, say someone will follow up and end politely. "
        "Do not invent pricing or legal commitments."
    ),
).strip()
VERIFY_SIGNATURES = os.getenv("VOICE_RELAY_VERIFY_SIGNATURES", "true").lower() != "false"

app = FastAPI(title="Aarvanta Voice Relay", version="1.0.0")
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


def verify_twilio_signature(url: str, signature: str | None) -> bool:
    """Validate X-Twilio-Signature for the WebSocket handshake URL (no body params)."""
    if not VERIFY_SIGNATURES:
        return True
    if not TWILIO_AUTH_TOKEN:
        log.warning("TWILIO_AUTH_TOKEN missing — rejecting signed handshake")
        return False
    if not signature or not url:
        return False
    digest = hmac.new(
        TWILIO_AUTH_TOKEN.encode("utf-8"),
        url.encode("utf-8"),
        hashlib.sha1,
    ).digest()
    expected = base64.b64encode(digest).decode("utf-8")
    return hmac.compare_digest(expected, signature)


def resolve_handshake_url(websocket: WebSocket) -> str:
    """Prefer configured public wss URL so signature matches TwiML exactly."""
    if VOICE_RELAY_WSS_URL:
        return VOICE_RELAY_WSS_URL.rstrip("/")
    # Fall back to reconstructed URL from headers (behind nginx TLS termination).
    proto = websocket.headers.get("x-forwarded-proto", "https")
    host = websocket.headers.get("x-forwarded-host") or websocket.headers.get("host") or "localhost"
    path = websocket.url.path
    scheme = "wss" if proto in ("https", "wss") else "ws"
    return f"{scheme}://{host}{path}"


async def send_text(ws: WebSocket, token: str, *, last: bool) -> None:
    await ws.send_json({"type": "text", "token": token, "last": last})


async def end_session(ws: WebSocket, handoff: str = "completed") -> None:
    await ws.send_json({"type": "end", "handoffData": handoff})


def build_reply(history: list[dict[str, str]], user_text: str) -> str:
    history.append({"role": "user", "content": user_text})
    if not openai_client:
        reply = (
            "Thanks for calling Aarvanta. AI is not configured on the voice relay yet. "
            "Please leave a message after this call and we will get back to you."
        )
        history.append({"role": "assistant", "content": reply})
        return reply

    messages = [{"role": "system", "content": SYSTEM_PROMPT}, *history]
    completion = openai_client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,  # type: ignore[arg-type]
        max_tokens=220,
        temperature=0.6,
    )
    reply = (completion.choices[0].message.content or "").strip()
    if not reply:
        reply = "Sorry, I did not catch that. Could you say it again?"
    history.append({"role": "assistant", "content": reply})
    # Cap history to keep latency low
    if len(history) > 16:
        del history[:-16]
    return reply


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse(
        {
            "status": "ok",
            "service": "aarvanta-voice-relay",
            "openai": bool(OPENAI_API_KEY),
            "signatureVerification": VERIFY_SIGNATURES and bool(TWILIO_AUTH_TOKEN),
            "wssUrlConfigured": bool(VOICE_RELAY_WSS_URL),
        }
    )


@app.get("/")
async def root() -> PlainTextResponse:
    return PlainTextResponse(
        "Aarvanta Voice Relay — WebSocket at /ws (ConversationRelay). See /health."
    )


@app.websocket("/ws")
async def conversation_relay(websocket: WebSocket) -> None:
    signature = websocket.headers.get("x-twilio-signature")
    handshake_url = resolve_handshake_url(websocket)

    if not verify_twilio_signature(handshake_url, signature):
        log.warning("Rejecting WebSocket — invalid Twilio signature for %s", handshake_url)
        await websocket.close(code=1008)
        return

    await websocket.accept()
    log.info("ConversationRelay connected (%s)", handshake_url)

    history: list[dict[str, str]] = []
    session: dict[str, Any] = {}

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                log.warning("Non-JSON frame: %s", raw[:120])
                continue

            msg_type = msg.get("type")
            if msg_type == "setup":
                session = {
                    "callSid": msg.get("callSid"),
                    "from": msg.get("from"),
                    "to": msg.get("to"),
                    "sessionId": msg.get("sessionId"),
                    "customParameters": msg.get("customParameters") or {},
                }
                log.info(
                    "setup callSid=%s from=%s params=%s",
                    session.get("callSid"),
                    session.get("from"),
                    session.get("customParameters"),
                )
                # welcomeGreeting is spoken by Twilio; optional context for LLM
                context = session["customParameters"].get("context")
                if context:
                    history.append(
                        {
                            "role": "system",
                            "content": f"Call context from Voice OS: {context}",
                        }
                    )
                continue

            if msg_type == "prompt":
                prompt = (msg.get("voicePrompt") or "").strip()
                last = bool(msg.get("last", True))
                if not prompt or not last:
                    continue
                log.info("prompt: %s", prompt[:160])
                try:
                    reply = build_reply(history, prompt)
                except Exception as exc:  # noqa: BLE001
                    log.exception("OpenAI failed: %s", exc)
                    reply = "Sorry, I am having trouble right now. Please try again in a moment."
                # Stream as a single final token (ConversationRelay TTS)
                await send_text(websocket, reply, last=True)
                # Soft hang-up phrases
                lower = prompt.lower()
                if any(p in lower for p in ("goodbye", "bye", "end the call", "hang up")):
                    await end_session(websocket, "caller_ended")
                    break
                continue

            if msg_type == "interrupt":
                log.info("interrupt received")
                continue

            if msg_type == "dtmf":
                digit = msg.get("digit")
                log.info("dtmf digit=%s", digit)
                continue

            if msg_type == "error":
                log.error("twilio error: %s", msg)
                continue

            log.debug("ignored message type=%s", msg_type)

    except WebSocketDisconnect:
        log.info("ConversationRelay disconnected callSid=%s", session.get("callSid"))
    except Exception as exc:  # noqa: BLE001
        log.exception("WebSocket error: %s", exc)
        try:
            await websocket.close(code=1011)
        except Exception:  # noqa: BLE001
            pass


if __name__ == "__main__":
    import uvicorn

    # Local/dev only — production uses uvicorn via systemd/docker
    host = "0.0.0.0"
    log.info("Starting voice-relay on %s:%s", host, PORT)
    uvicorn.run("app:app", host=host, port=PORT, reload=False)
