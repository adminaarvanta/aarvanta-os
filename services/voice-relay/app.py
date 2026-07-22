"""
Aarvanta Voice Relay — Twilio ConversationRelay WebSocket sidecar.

Deploy on EC2 (co-locate with onboarding or dedicated). Twilio connects with
wss:// and streams caller speech as text prompts; we stream OpenAI chat tokens
that ConversationRelay speaks aloud.

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
from urllib import request as urlrequest
from urllib.error import URLError

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
VOICE_RELAY_WSS_URL = os.getenv("VOICE_RELAY_WSS_URL", "").strip()
# Optional: POST transcripts back to Aarvanta OS
AARVANTA_CALLBACK_URL = os.getenv("AARVANTA_VOICE_CALLBACK_URL", "").strip()
AARVANTA_CALLBACK_SECRET = os.getenv("VOICE_RELAY_CALLBACK_SECRET", "").strip()

DEFAULT_SYSTEM = (
    "You are Aarvanta Voice OS, a concise phone assistant for a business OS. "
    "Keep replies short (1–3 spoken sentences). Be helpful, professional, and clear. "
    "If the caller wants to end the call, say goodbye politely. "
    "Do not invent pricing or legal commitments. Never mention you are an AI unless asked."
)
SYSTEM_PROMPT = os.getenv("VOICE_AGENT_SYSTEM_PROMPT", DEFAULT_SYSTEM).strip()
VERIFY_SIGNATURES = os.getenv("VOICE_RELAY_VERIFY_SIGNATURES", "true").lower() != "false"

app = FastAPI(title="Aarvanta Voice Relay", version="1.1.0")
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


def verify_twilio_signature(url: str, signature: str | None) -> bool:
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
    if VOICE_RELAY_WSS_URL:
        return VOICE_RELAY_WSS_URL.rstrip("/")
    proto = websocket.headers.get("x-forwarded-proto", "https")
    host = websocket.headers.get("x-forwarded-host") or websocket.headers.get("host") or "localhost"
    path = websocket.url.path
    scheme = "wss" if proto in ("https", "wss") else "ws"
    return f"{scheme}://{host}{path}"


async def send_text(ws: WebSocket, token: str, *, last: bool) -> None:
    await ws.send_json({"type": "text", "token": token, "last": last, "interruptible": True})


async def end_session(ws: WebSocket, handoff: str = "completed") -> None:
    await ws.send_json({"type": "end", "handoffData": handoff})


def build_system_prompt(params: dict[str, Any]) -> str:
    parts = [SYSTEM_PROMPT]
    direction = (params.get("direction") or "").strip().lower()
    if direction == "inbound":
        parts.append(
            "This is an inbound call — the customer dialed Aarvanta. "
            "Greet briefly if needed, learn why they called, and help."
        )
    elif direction == "outbound":
        parts.append(
            "This is an outbound call you placed. Introduce yourself briefly, "
            "state the reason for calling, then listen and respond."
        )
    goal = (params.get("goal") or params.get("context") or "").strip()
    if goal:
        parts.append(f"Call goal / context from Voice OS: {goal}")
    return "\n\n".join(parts)


async def stream_reply(ws: WebSocket, history: list[dict[str, str]], system: str, user_text: str) -> str:
    history.append({"role": "user", "content": user_text})
    if not openai_client:
        reply = (
            "Thanks for calling Aarvanta. AI is not configured on the voice relay yet. "
            "Please try again later."
        )
        history.append({"role": "assistant", "content": reply})
        await send_text(ws, reply, last=True)
        return reply

    messages = [{"role": "system", "content": system}, *history]
    stream = openai_client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,  # type: ignore[arg-type]
        max_tokens=220,
        temperature=0.55,
        stream=True,
    )

    full: list[str] = []
    buffer = ""
    for chunk in stream:
        delta = chunk.choices[0].delta.content or ""
        if not delta:
            continue
        full.append(delta)
        buffer += delta
        # Flush on word boundaries to keep TTS natural and low-latency
        if any(buffer.endswith(ch) for ch in (" ", ".", "!", "?", ",", ";", ":")) or len(buffer) >= 28:
            await send_text(ws, buffer, last=False)
            buffer = ""

    reply = "".join(full).strip() or "Sorry, I did not catch that. Could you say it again?"
    # Final token must set last=true so ConversationRelay finishes TTS turn
    await send_text(ws, buffer if buffer else " ", last=True)
    history.append({"role": "assistant", "content": reply})
    if len(history) > 20:
        del history[:-20]
    return reply


def post_transcript(session: dict[str, Any], turns: list[dict[str, str]], summary: str) -> None:
    if not AARVANTA_CALLBACK_URL or not AARVANTA_CALLBACK_SECRET:
        return
    payload = {
        "callSid": session.get("callSid"),
        "from": session.get("from"),
        "to": session.get("to"),
        "conversationId": (session.get("customParameters") or {}).get("conversationId"),
        "direction": (session.get("customParameters") or {}).get("direction"),
        "turns": turns,
        "summary": summary,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urlrequest.Request(
        AARVANTA_CALLBACK_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
            "X-Voice-Relay-Secret": AARVANTA_CALLBACK_SECRET,
        },
        method="POST",
    )
    try:
        with urlrequest.urlopen(req, timeout=8) as resp:
            log.info("transcript callback status=%s", resp.status)
    except URLError as exc:
        log.warning("transcript callback failed: %s", exc)


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse(
        {
            "status": "ok",
            "service": "aarvanta-voice-relay",
            "version": "1.1.0",
            "openai": bool(OPENAI_API_KEY),
            "signatureVerification": VERIFY_SIGNATURES and bool(TWILIO_AUTH_TOKEN),
            "wssUrlConfigured": bool(VOICE_RELAY_WSS_URL),
            "callbackConfigured": bool(AARVANTA_CALLBACK_URL and AARVANTA_CALLBACK_SECRET),
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
    transcript: list[dict[str, str]] = []
    session: dict[str, Any] = {}
    system = SYSTEM_PROMPT

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
                params = msg.get("customParameters") or {}
                session = {
                    "callSid": msg.get("callSid"),
                    "from": msg.get("from"),
                    "to": msg.get("to"),
                    "sessionId": msg.get("sessionId"),
                    "direction": msg.get("direction"),
                    "customParameters": params,
                }
                if not params.get("direction") and msg.get("direction"):
                    params["direction"] = str(msg.get("direction")).lower()
                system = build_system_prompt(params)
                log.info(
                    "setup callSid=%s from=%s direction=%s",
                    session.get("callSid"),
                    session.get("from"),
                    params.get("direction"),
                )
                continue

            if msg_type == "prompt":
                prompt = (msg.get("voicePrompt") or "").strip()
                last = bool(msg.get("last", True))
                if not prompt or not last:
                    continue
                log.info("prompt: %s", prompt[:160])
                transcript.append({"role": "user", "content": prompt})
                try:
                    reply = await stream_reply(websocket, history, system, prompt)
                except Exception as exc:  # noqa: BLE001
                    log.exception("OpenAI failed: %s", exc)
                    reply = "Sorry, I am having trouble right now. Please try again in a moment."
                    await send_text(websocket, reply, last=True)
                transcript.append({"role": "assistant", "content": reply})

                lower = prompt.lower()
                if any(
                    p in lower
                    for p in (
                        "goodbye",
                        "bye bye",
                        "end the call",
                        "hang up",
                        "that's all",
                        "that is all",
                    )
                ):
                    await end_session(websocket, json.dumps({"reason": "caller_ended"}))
                    break
                continue

            if msg_type == "interrupt":
                log.info("interrupt received")
                continue

            if msg_type == "dtmf":
                log.info("dtmf digit=%s", msg.get("digit"))
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
    finally:
        if transcript:
            summary_bits = [t["content"][:120] for t in transcript if t["role"] == "assistant"]
            summary = " · ".join(summary_bits[-3:]) if summary_bits else "AI voice call"
            try:
                post_transcript(session, transcript, summary)
            except Exception as exc:  # noqa: BLE001
                log.warning("post_transcript error: %s", exc)


if __name__ == "__main__":
    import uvicorn

    host = "0.0.0.0"
    log.info("Starting voice-relay on %s:%s", host, PORT)
    uvicorn.run("app:app", host=host, port=PORT, reload=False)
