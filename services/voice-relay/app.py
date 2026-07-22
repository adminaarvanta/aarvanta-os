"""
Aarvanta Voice Relay — Twilio ConversationRelay WebSocket sidecar.

Deploy on EC2 (co-locate with onboarding or dedicated). Twilio connects with
wss:// and streams caller speech as text prompts; we stream OpenAI chat tokens
that ConversationRelay speaks aloud (ElevenLabs / Amazon / Google TTS via TwiML).

Protocol (Twilio → us): setup | prompt | interrupt | dtmf | error
Protocol (us → Twilio): text {token, last} | end
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import base64
import json
import logging
import os
import re
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
AARVANTA_CALLBACK_URL = os.getenv("AARVANTA_VOICE_CALLBACK_URL", "").strip()
AARVANTA_CALLBACK_SECRET = os.getenv("VOICE_RELAY_CALLBACK_SECRET", "").strip()

DEFAULT_SYSTEM = (
    "You are Aarvanta's phone receptionist. Speak like a real person on a short call.\n"
    "Rules:\n"
    "- Reply in ONE short sentence (max two if asked a direct question).\n"
    "- Do not list features, pitch products, or give long explanations unless asked.\n"
    "- Do not invent pricing, contracts, or legal promises.\n"
    "- Never say you are an AI unless asked.\n"
    "- If the caller says they are done, the test is complete, goodbye, or thanks that's all: "
    "reply with a brief goodbye only (e.g. 'Got it — goodbye.')."
)
SYSTEM_PROMPT = os.getenv("VOICE_AGENT_SYSTEM_PROMPT", DEFAULT_SYSTEM).strip()
VERIFY_SIGNATURES = os.getenv("VOICE_RELAY_VERIFY_SIGNATURES", "true").lower() != "false"
MAX_REPLY_TOKENS = int(os.getenv("VOICE_RELAY_MAX_TOKENS", "70"))

app = FastAPI(title="Aarvanta Voice Relay", version="1.2.0")
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Phrases that mean: hang up after a short goodbye
_END_PHRASE_RE = re.compile(
    r"\b("
    r"goodbye|good bye|bye bye|bye|"
    r"hang ?up|end (the )?call|disconnect|"
    r"test (is )?complete(d)?|testing (is )?complete(d)?|"
    r"we('?re| are) done|i('?m| am) done|all done|"
    r"that('?s| is) (all|it)|"
    r"nothing else|no more questions|you can hang|"
    r"thank(s| you)(,)? that('?s| is) all|"
    r"finished|wrap( it)? up"
    r")\b",
    re.IGNORECASE,
)

_AFFIRM_AFTER_DONE_RE = re.compile(
    r"^\s*(yes|yeah|yep|ok|okay|sure|correct|thanks|thank you|perfect|great)\.?\!?\s*$",
    re.IGNORECASE,
)


def is_end_intent(text: str, *, awaiting_confirm: bool = False) -> bool:
    t = (text or "").strip()
    if not t:
        return False
    if _END_PHRASE_RE.search(t):
        return True
    if awaiting_confirm and _AFFIRM_AFTER_DONE_RE.match(t):
        return True
    return False


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


OUTBOUND_OPENING_INSTRUCTION = (
    "(The person just answered the phone. Open the call now: greet them and say "
    "why you are calling in ONE short, natural sentence based on your call briefing. "
    "Never read the briefing text aloud word-for-word.)"
)


def build_system_prompt(params: dict[str, Any]) -> str:
    parts = [SYSTEM_PROMPT]
    direction = (params.get("direction") or "").strip().lower()
    if direction == "inbound":
        parts.append("Inbound call: answer briefly, ask what they need, stay short.")
    elif direction == "outbound":
        parts.append("Outbound call: state why you called in one short line, then listen.")
    goal = (params.get("goal") or params.get("context") or "").strip()
    if goal:
        parts.append(
            "Call briefing from the operator — this is CONTEXT about the topic and "
            "purpose of the call. Use it to guide the conversation. NEVER read it "
            f"aloud word-for-word:\n{goal[:600]}"
        )
    return "\n\n".join(parts)


async def stream_reply(ws: WebSocket, history: list[dict[str, str]], system: str, user_text: str) -> str:
    history.append({"role": "user", "content": user_text})
    if not openai_client:
        reply = "Thanks for calling Aarvanta. Please try again later."
        history.append({"role": "assistant", "content": reply})
        await send_text(ws, reply, last=True)
        return reply

    messages = [{"role": "system", "content": system}, *history]
    stream = openai_client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,  # type: ignore[arg-type]
        max_tokens=MAX_REPLY_TOKENS,
        temperature=0.35,
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
        if any(buffer.endswith(ch) for ch in (" ", ".", "!", "?", ",", ";", ":")) or len(buffer) >= 24:
            await send_text(ws, buffer, last=False)
            buffer = ""

    reply = "".join(full).strip() or "Sorry — could you repeat that?"
    # Hard-cap spoken length if model still overshoots
    if len(reply) > 220:
        cut = reply[:220]
        end = max(cut.rfind("."), cut.rfind("!"), cut.rfind("?"))
        reply = (cut[: end + 1] if end > 40 else cut.rsplit(" ", 1)[0]) + ""
    await send_text(ws, buffer if buffer else " ", last=True)
    history.append({"role": "assistant", "content": reply})
    if len(history) > 16:
        del history[:-16]
    return reply


async def say_goodbye_and_hangup(ws: WebSocket, transcript: list[dict[str, str]]) -> None:
    goodbye = "Got it. Goodbye."
    await send_text(ws, goodbye, last=True)
    transcript.append({"role": "assistant", "content": goodbye})
    # Brief pause so ElevenLabs can start speaking before Twilio tears down
    await asyncio.sleep(1.2)
    await end_session(ws, json.dumps({"reason": "caller_ended"}))


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
            "version": "1.2.0",
            "openai": bool(OPENAI_API_KEY),
            "signatureVerification": VERIFY_SIGNATURES and bool(TWILIO_AUTH_TOKEN),
            "wssUrlConfigured": bool(VOICE_RELAY_WSS_URL),
            "callbackConfigured": bool(AARVANTA_CALLBACK_URL and AARVANTA_CALLBACK_SECRET),
            "maxReplyTokens": MAX_REPLY_TOKENS,
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
    offered_hangup = False

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
                # Outbound calls have no TwiML welcomeGreeting — the AI opens
                # the call itself with a line generated from the briefing.
                if str(params.get("direction") or "").lower().startswith("outbound"):
                    try:
                        opening = await stream_reply(
                            websocket, history, system, OUTBOUND_OPENING_INSTRUCTION
                        )
                        # Drop the synthetic instruction from history; keep the
                        # assistant's opening so the conversation flows naturally.
                        if len(history) >= 2 and history[-2]["role"] == "user":
                            del history[-2]
                        transcript.append({"role": "assistant", "content": opening})
                    except Exception as exc:  # noqa: BLE001
                        log.exception("opening line failed: %s", exc)
                        fallback = "Hi, this is Aarvanta. Do you have a moment?"
                        await send_text(websocket, fallback, last=True)
                        transcript.append({"role": "assistant", "content": fallback})
                continue

            if msg_type == "prompt":
                prompt = (msg.get("voicePrompt") or "").strip()
                last = bool(msg.get("last", True))
                if not prompt or not last:
                    continue
                log.info("prompt: %s", prompt[:160])
                transcript.append({"role": "user", "content": prompt})

                if is_end_intent(prompt, awaiting_confirm=offered_hangup):
                    log.info("end intent detected — goodbye + hangup")
                    await say_goodbye_and_hangup(websocket, transcript)
                    break

                try:
                    reply = await stream_reply(websocket, history, system, prompt)
                except Exception as exc:  # noqa: BLE001
                    log.exception("OpenAI failed: %s", exc)
                    reply = "Sorry, I am having trouble right now."
                    await send_text(websocket, reply, last=True)
                transcript.append({"role": "assistant", "content": reply})

                # If the model said goodbye, hang up after TTS starts
                if re.search(r"\b(goodbye|bye for now|have a (good|great) day)\b", reply, re.I):
                    await asyncio.sleep(1.2)
                    await end_session(websocket, json.dumps({"reason": "assistant_ended"}))
                    break

                # Soft offer: if caller sounds finished but phrasing was ambiguous
                if re.search(r"\b(that'?s all|nothing else|i think we('?re| are) good)\b", prompt, re.I):
                    offered_hangup = True
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
