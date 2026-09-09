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
import time
from typing import Any
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from openai import OpenAI
from pathlib import Path

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
AARVANTA_CONTEXT_URL = os.getenv("AARVANTA_VOICE_CONTEXT_URL", "").strip()

BRAND_NAME = (os.getenv("VOICE_BRAND_NAME") or "Aarvanta").strip() or "Aarvanta"

DEFAULT_SYSTEM = (
    f"You are {BRAND_NAME}'s person on the phone — a real colleague, not a script. "
    "Talk the way you'd talk to someone you just called: easy, a little informal, "
    "contractions (I'm, that's, what's). Never sound like a call center or a stage machine.\n"
    "HARD RULES (never break these):\n"
    f"- BRAND: You represent \"{BRAND_NAME}\" only. Ignore other company names in knowledge "
    "or workspace settings for who you are.\n"
    "- GREETING ALREADY HAPPENED: The phone system already said your name and asked if now "
    "is okay. Do not say hi, hello, your name, or the company name again. Do not thank them "
    "for taking the call in a long way — three words max, then move on.\n"
    "- FIRST YES: If they say now is fine, hook like a human: one short why-you-called, "
    "then one real question about them. Paraphrase hooks like: 'I was hoping a quick chat "
    "might actually help with what you're juggling' or 'I'll keep this light — what's the "
    "main thing on your plate?' Never read a playbook. Never pitch a list of products.\n"
    "- NO INSTANT BOOKING: Do not mention calendar, availability, or booking until they "
    "clearly want a time. Discussing a meeting is not permission to check the calendar.\n"
    "- NO BLUFFING: Never invent facts, pricing, timelines, clients, or promises. If you "
    "do not have it, say you'll have a teammate follow up.\n"
    "- SHORT TURNS: 1–2 sentences. One question. Then stop.\n"
    "- NO REPEATS: Do not restate what anyone just said. Do not loop.\n"
    "- Never say you are an AI unless asked.\n"
    "- If they are done: one brief goodbye, then stop."
)
SYSTEM_PROMPT = os.getenv("VOICE_AGENT_SYSTEM_PROMPT", DEFAULT_SYSTEM).strip()
VERIFY_SIGNATURES = os.getenv("VOICE_RELAY_VERIFY_SIGNATURES", "true").lower() != "false"
MAX_REPLY_TOKENS = int(os.getenv("VOICE_RELAY_MAX_TOKENS", "160"))
MAX_REPLY_CHARS = int(os.getenv("VOICE_RELAY_MAX_CHARS", "380"))
REPLY_TEMPERATURE = float(os.getenv("VOICE_RELAY_TEMPERATURE", "0.72"))
REPLY_FREQUENCY_PENALTY = float(os.getenv("VOICE_RELAY_FREQUENCY_PENALTY", "0.35"))
REPLY_PRESENCE_PENALTY = float(os.getenv("VOICE_RELAY_PRESENCE_PENALTY", "0.2"))
CONTEXT_FETCH_TIMEOUT = float(os.getenv("VOICE_RELAY_CONTEXT_TIMEOUT", "1.5"))
TOOL_FETCH_TIMEOUT = float(os.getenv("VOICE_RELAY_TOOL_TIMEOUT", "8"))
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
TTS_DIR = Path(os.getenv("VOICE_RELAY_TTS_DIR", "/tmp/aarvanta-voice-tts"))
TTS_TTL_SECONDS = int(os.getenv("VOICE_RELAY_TTS_TTL", "120"))
CLONE_TTS_TIMEOUT = float(os.getenv("VOICE_RELAY_CLONE_TTS_TIMEOUT", "6"))
SERVICE_VERSION = "1.9.3"
MAX_TOOL_ROUNDS = 3

app = FastAPI(title="Aarvanta Voice Relay", version=SERVICE_VERSION)
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


def resolve_context_url() -> str:
    if AARVANTA_CONTEXT_URL:
        return AARVANTA_CONTEXT_URL.rstrip("/")
    if AARVANTA_CALLBACK_URL and "/api/webhooks/voice-relay" in AARVANTA_CALLBACK_URL:
        return AARVANTA_CALLBACK_URL.replace(
            "/api/webhooks/voice-relay", "/api/voice/context"
        ).rstrip("/")
    return ""


def resolve_api_base() -> str:
    """https://os… origin for /api/voice/tools/*."""
    ctx = resolve_context_url()
    if ctx and "/api/voice/context" in ctx:
        return ctx.replace("/api/voice/context", "").rstrip("/")
    if AARVANTA_CALLBACK_URL and "/api/" in AARVANTA_CALLBACK_URL:
        return AARVANTA_CALLBACK_URL.split("/api/")[0].rstrip("/")
    return ""


BOOKING_TOOLS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "get_availability",
            "description": (
                "Fetch the next business days with concrete available meeting slots. "
                "Call this before offering times. Never invent slots."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "timezone": {
                        "type": "string",
                        "description": "IANA timezone, e.g. America/New_York",
                    },
                    "days": {
                        "type": "integer",
                        "description": "Number of business days to check (1–3)",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "book_meeting",
            "description": (
                "Book a discovery meeting on the calendar after the caller clearly "
                "agrees to a specific start/end slot from get_availability."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "meetingStart": {
                        "type": "string",
                        "description": "ISO-8601 start from an availability slot",
                    },
                    "meetingEnd": {
                        "type": "string",
                        "description": "ISO-8601 end from an availability slot",
                    },
                    "timezone": {
                        "type": "string",
                        "description": "IANA timezone used for the booking",
                    },
                },
                "required": ["meetingStart", "meetingEnd"],
            },
        },
    },
]


def post_tool_json(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    base = resolve_api_base()
    if not base or not AARVANTA_CALLBACK_SECRET:
        return {"error": "Calendar tools not configured on relay"}
    url = f"{base}{path}"
    data = json.dumps(payload).encode("utf-8")
    req = urlrequest.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "X-Voice-Relay-Secret": AARVANTA_CALLBACK_SECRET,
        },
        method="POST",
    )
    try:
        with urlrequest.urlopen(req, timeout=TOOL_FETCH_TIMEOUT) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return body if isinstance(body, dict) else {"error": "Invalid tool response"}
    except HTTPError as exc:
        try:
            detail = exc.read().decode("utf-8")
            parsed = json.loads(detail)
            if isinstance(parsed, dict):
                return parsed
        except Exception:  # noqa: BLE001
            detail = str(exc)
        return {"error": f"Tool HTTP {exc.code}: {detail}"}
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        return {"error": str(exc)}


def execute_booking_tool(
    name: str,
    arguments: dict[str, Any],
    call_context: dict[str, Any],
) -> dict[str, Any]:
    timezone = (
        str(arguments.get("timezone") or call_context.get("timezone") or "America/New_York")
    )
    if name == "get_availability":
        cached = call_context.get("lastAvailability")
        if isinstance(cached, dict) and not cached.get("error"):
            return cached
        days = int(arguments.get("days") or 3)
        days = max(1, min(days, 3))
        result = post_tool_json(
            "/api/voice/tools/calendar/availability",
            {"timezone": timezone, "days": days},
        )
        if isinstance(result, dict) and not result.get("error"):
            call_context["lastAvailability"] = result
        return result

    if name == "book_meeting":
        lead_id = str(call_context.get("contactId") or "").strip()
        if not lead_id:
            return {
                "error": "No CRM contact on this call — cannot book. Ask to follow up by email."
            }
        meeting_start = str(arguments.get("meetingStart") or "").strip()
        meeting_end = str(arguments.get("meetingEnd") or "").strip()
        if not meeting_start or not meeting_end:
            return {"error": "meetingStart and meetingEnd are required"}
        payload: dict[str, Any] = {
            "leadId": lead_id,
            "meetingStart": meeting_start,
            "meetingEnd": meeting_end,
            "timezone": timezone,
        }
        if call_context.get("sessionId"):
            payload["sessionId"] = call_context["sessionId"]
        if call_context.get("campaignId"):
            payload["campaignId"] = call_context["campaignId"]
        if call_context.get("voiceAgentName"):
            payload["salesRepName"] = call_context["voiceAgentName"]
        return post_tool_json("/api/voice/tools/calendar/book", payload)

    return {"error": f"Unknown tool: {name}"}


async def send_text(ws: WebSocket, token: str, *, last: bool) -> None:
    await ws.send_json({"type": "text", "token": token, "last": last, "interruptible": True})


async def send_play(ws: WebSocket, source: str) -> None:
    await ws.send_json(
        {
            "type": "play",
            "source": source,
            "loop": 1,
            "interruptible": True,
            "preemptible": True,
        }
    )


def resolve_tts_public_base() -> str:
    explicit = os.getenv("VOICE_RELAY_TTS_PUBLIC_BASE", "").strip()
    if explicit:
        return explicit.rstrip("/")
    wss = VOICE_RELAY_WSS_URL.rstrip("/")
    if wss.endswith("/ws"):
        http = wss[:-3].replace("wss://", "https://").replace("ws://", "http://")
        return f"{http.rstrip('/')}/tts"
    return ""


def _cleanup_tts_dir() -> None:
    if not TTS_DIR.is_dir():
        return
    cutoff = time.time() - TTS_TTL_SECONDS
    for path in TTS_DIR.glob("*.mp3"):
        try:
            if path.stat().st_mtime < cutoff:
                path.unlink(missing_ok=True)
        except OSError:
            continue


_tts_url_cache: dict[str, tuple[float, str]] = {}


def synthesize_cloned_mp3(voice_id: str, text: str) -> str | None:
    """ElevenLabs TTS → short-lived public MP3 URL for ConversationRelay play."""
    if not ELEVENLABS_API_KEY or not voice_id or not text.strip():
        return None
    public_base = resolve_tts_public_base()
    if not public_base:
        log.warning("cloned TTS skipped — VOICE_RELAY_WSS_URL / TTS public base unset")
        return None
    cache_key = hashlib.sha256(f"{voice_id}:{text.strip()}".encode()).hexdigest()
    cached = _tts_url_cache.get(cache_key)
    if cached and time.time() - cached[0] < TTS_TTL_SECONDS:
        return cached[1]
    TTS_DIR.mkdir(parents=True, exist_ok=True)
    _cleanup_tts_dir()
    payload = json.dumps(
        {"text": text.strip(), "model_id": "eleven_flash_v2_5"}
    ).encode("utf-8")
    req = urlrequest.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        data=payload,
        headers={
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        method="POST",
    )
    try:
        with urlrequest.urlopen(req, timeout=CLONE_TTS_TIMEOUT) as resp:
            audio = resp.read()
    except (HTTPError, URLError, TimeoutError) as exc:
        log.warning("elevenlabs tts failed: %s", exc)
        return None
    if not audio:
        return None
    token = hashlib.sha256(f"{voice_id}:{time.time()}:{text[:48]}".encode()).hexdigest()[:24]
    filename = f"{token}.mp3"
    (TTS_DIR / filename).write_bytes(audio)
    url = f"{public_base}/{filename}"
    _tts_url_cache[cache_key] = (time.time(), url)
    if len(_tts_url_cache) > 40:
        oldest = sorted(_tts_url_cache.items(), key=lambda item: item[1][0])[:10]
        for key, _ in oldest:
            _tts_url_cache.pop(key, None)
    return url


def _speech_seconds(text: str) -> float:
    return max(1.2, min(8.0, len(text) / 13.0 + 0.4))


async def end_session(ws: WebSocket, handoff: str = "completed") -> None:
    await ws.send_json({"type": "end", "handoffData": handoff})


OUTBOUND_OPENING_INSTRUCTION = (
    "(The person already heard your name and company from the phone greeting, "
    "which asked if now is an alright time. Do NOT greet or introduce yourself again. "
    "Do NOT mention booking, meetings, or calendar. One short natural follow-up only "
    "if you must speak — otherwise wait for them. Never read the briefing aloud.)"
)

INBOUND_OPENING_INSTRUCTION = (
    f"(Inbound call already heard a greeting from {BRAND_NAME}. Do NOT greet again. "
    "Do NOT mention booking. Ask how you can help in one short sentence only if you "
    "must speak — the TwiML greeting already asked.)"
)


def fetch_voice_context(params: dict[str, Any], session: dict[str, Any]) -> dict[str, Any]:
    """Pull Knowledge Hub digest + campaign memory/FSM from Aarvanta OS."""
    url = resolve_context_url()
    if not url or not AARVANTA_CALLBACK_SECRET:
        return {}

    payload = {
        "conversationId": (params.get("conversationId") or "").strip() or None,
        "direction": (params.get("direction") or "").strip() or None,
        "topic": (params.get("goal") or params.get("context") or "").strip() or None,
        "from": session.get("from"),
        "to": session.get("to"),
        "contactId": (params.get("contactId") or "").strip() or None,
        "queueId": (params.get("queueId") or "").strip() or None,
        "sessionId": (params.get("sessionId") or "").strip() or None,
        "campaignId": (params.get("campaignId") or "").strip() or None,
        "voiceAgentId": (params.get("voiceAgentId") or "").strip() or None,
    }
    data = json.dumps({k: v for k, v in payload.items() if v}).encode("utf-8")
    req = urlrequest.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "X-Voice-Relay-Secret": AARVANTA_CALLBACK_SECRET,
        },
        method="POST",
    )
    try:
        with urlrequest.urlopen(req, timeout=CONTEXT_FETCH_TIMEOUT) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if not isinstance(body, dict):
                return {}
            return body
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        log.warning("voice context fetch failed: %s", exc)
        return {}


def build_system_prompt(
    params: dict[str, Any],
    *,
    business_name: str = "",
    knowledge_digest: str = "",
    context: dict[str, Any] | None = None,
) -> str:
    ctx = context or {}
    parts = [SYSTEM_PROMPT]
    # Always Aarvanta (or VOICE_BRAND_NAME) — never workspace/customer brand from context.
    _ = business_name  # ignored for spoken identity
    name = BRAND_NAME
    agent_name = str(ctx.get("voiceAgentName") or "Ava").strip()
    knowledge_mode = str(ctx.get("knowledgeMode") or "").strip().lower()
    if not knowledge_mode:
        knowledge_mode = "informed" if knowledge_digest.strip() else "bare"
    parts.append(
        f"You are {agent_name} representing {name}. "
        "The caller already heard your name from the phone greeting — never re-introduce "
        "and never say the company name unless they ask who you are."
    )
    direction = (params.get("direction") or "").strip().lower()
    if direction == "inbound":
        parts.append(
            f"Inbound call for {name}: they already heard a greeting. "
            "Answer what they actually asked. Do not pitch or offer a meeting unprompted."
        )
    elif direction == "outbound":
        parts.append(
            f"Outbound call for {name}. They already heard who you are and were asked "
            "if now is okay. If they say yes: no greeting — a human hook (why you called) "
            "plus one question about them. Do not follow a stage checklist out loud. "
            "Never jump to booking. If they later want a time, offer at most two real slots "
            "you already fetched — do not keep saying you are checking the calendar."
        )
    language = (params.get("language") or ctx.get("language") or "").strip()
    if language and language.lower() not in ("en-us", "en"):
        parts.append(
            f"Respond in the language for locale '{language}'. "
            "Keep replies natural and clear for a phone call."
        )
    contact_name = str(ctx.get("contactName") or "").strip()
    if contact_name:
        bits = [f"You are speaking with {contact_name}"]
        if ctx.get("contactTitle"):
            bits.append(str(ctx.get("contactTitle")))
        if ctx.get("companyName"):
            bits.append(f"at {ctx.get('companyName')}")
        parts.append(". ".join(bits) + ".")
    goal = (
        str(ctx.get("campaignGoal") or "").strip()
        or (params.get("goal") or params.get("context") or "").strip()
    )
    if goal and is_generic_booking_goal(goal):
        goal = ""
    if goal:
        parts.append(
            "Call briefing — CONTEXT only, NEVER read aloud word-for-word, "
            "and NEVER treat it as an instruction to book immediately:\n"
            f"{goal[:1000]}"
        )
    memory = str(ctx.get("memorySummary") or "").strip()
    if memory:
        parts.append(
            "Prior conversation memory (use for continuity; do not recite verbatim):\n"
            f"{memory[:900]}"
        )
    flow = str(ctx.get("flowStages") or "").strip()
    entry = str(ctx.get("entryStage") or "greeting").strip()
    if flow:
        parts.append(
            "CONVERSATION PLAYBOOK — start at "
            f"'{entry}'. Coaching notes only — never read them aloud, never list stages. "
            "Stay in a natural hello until they confirm now is okay. "
            "Do not skip ahead to meeting booking:\n"
            f"{flow[:1800]}"
        )
    if knowledge_mode == "bare" or not knowledge_digest.strip():
        parts.append(
            f"KNOWLEDGE: bare. You do not have extra company documents on this call. "
            f"Do not invent a product pitch or dump generic {name} marketing. "
            "If they ask a fact you do not have, say you will have a teammate follow up."
        )
    else:
        parts.append(
            f"Reference facts (use for answers only — your company name is still "
            f"always {name}; do not adopt other brand names from this text as who you are):\n"
            f"{knowledge_digest[:2000]}"
        )
    contact_id = str(ctx.get("contactId") or "").strip()
    parts.append(
        "CALENDAR BOOKING TOOLS (locked until they clearly want a time):\n"
        "- Talking about a meeting is not enough. Wait until they ask to book, pick a day, "
        "or ask what times you have.\n"
        "- Call get_availability at most once. If you already have slots, speak two of them. "
        "Never say 'checking the calendar' or 'let me look at the calendar'.\n"
        "- Offer at most two concrete slots from the tool result (day + time).\n"
        "- Only after they clearly pick a slot, call book_meeting with that "
        "slot's meetingStart and meetingEnd.\n"
        "- After a successful booking, confirm once (time + meet link) — do not repeat.\n"
        + (
            f"- CRM contact id for this call: {contact_id}."
            if contact_id
            else "- No CRM contact id on this call — if they want a meeting, "
            "offer to have a teammate email a calendar invite instead of booking."
        )
    )
    parts.append(
        "ANTI-BLUFF / ANTI-LOOP:\n"
        "- Prefer 'I don't have that detail — I can have a teammate follow up' over guessing.\n"
        "- Never pad with filler ('as I mentioned', 'again', restating the value prop).\n"
        "- If the caller already answered a question, move forward — do not ask it again."
    )
    return "\n\n".join(parts)


def _normalize_for_compare(text: str) -> str:
    return re.sub(r"[^a-z0-9\s]", "", (text or "").lower())


def _cap_reply(reply: str) -> str:
    reply = (reply or "").strip()
    # Drop duplicate consecutive sentences (common LLM loop on phone turns).
    parts = re.split(r"(?<=[.!?])\s+", reply)
    cleaned: list[str] = []
    seen: set[str] = set()
    for part in parts:
        key = _normalize_for_compare(part)
        if not key or len(key) < 8:
            if part.strip():
                cleaned.append(part.strip())
            continue
        if key in seen:
            continue
        # Near-duplicate: high word overlap with a prior sentence
        words = set(key.split())
        if any(
            len(words & set(prev.split())) / max(len(words), 1) > 0.7
            for prev in seen
            if len(prev.split()) >= 4
        ):
            continue
        seen.add(key)
        cleaned.append(part.strip())
    reply = " ".join(cleaned).strip() or reply

    if len(reply) <= MAX_REPLY_CHARS:
        return reply
    cut = reply[:MAX_REPLY_CHARS]
    end = max(cut.rfind("."), cut.rfind("!"), cut.rfind("?"))
    return (cut[: end + 1] if end > 40 else cut.rsplit(" ", 1)[0]) + ""


def _dedupe_against_history(reply: str, history: list[dict[str, str]]) -> str:
    """If the model repeats the last assistant turn, collapse to a short nudge."""
    last_assistant = ""
    for turn in reversed(history):
        if turn.get("role") == "assistant" and turn.get("content"):
            last_assistant = turn["content"]
            break
    if not last_assistant:
        return reply
    a = _normalize_for_compare(reply)
    b = _normalize_for_compare(last_assistant)
    if not a or not b:
        return reply
    if a == b or (len(a) > 24 and (a in b or b in a)):
        return "Got it — what would you like to do next?"
    aw, bw = set(a.split()), set(b.split())
    if len(aw) >= 6 and len(aw & bw) / max(len(aw), 1) > 0.75:
        return "Understood. What would you like to cover?"
    return reply


_REINTRO_RE = re.compile(
    r"(?:^|(?<=[.!?]\s))"
    r"(?:hi|hey|hello)(?:\s+[A-Z][\w'-]{1,20})?"
    r"[,.]?\s+(?:this is|it's|it is|i'm|i am)\s+[\w'-]+"
    r"(?:\s+(?:calling\s+)?(?:from|at|with)\s+[^.]{2,40})?"
    r"[.!]?\s*",
    re.I,
)
_CHECK_CAL_RE = re.compile(
    r"(?:okay[,.]?\s+|sure[,.]?\s+|one moment[,—. ]*)?"
    r"(?:let me |i'll |i will )?"
    r"(?:just )?"
    r"(?:check(?:ing)?|look(?:ing)?(?:\s+(?:at|up))?|pull(?:ing)?|see)\s+"
    r"(?:the )?(?:calendar|availability|schedule)"
    r"[^.?!]*[.?!]?\s*",
    re.I,
)


def _humanize_spoken(reply: str) -> str:
    """Drop second intros and calendar-hold lines the model keeps repeating."""
    text = (reply or "").strip()
    text = _REINTRO_RE.sub("", text).strip()
    text = _CHECK_CAL_RE.sub("", text).strip()
    text = re.sub(r"\s{2,}", " ", text)
    return text or reply


_BOOKING_INTENT_RE = re.compile(
    r"\b("
    r"book(ing)?|"
    r"schedule|"
    r"availability|"
    r"calendar|"
    r"appointment|"
    r"time slots?|timeslots?|"
    r"what times?|"
    r"when (are you|were you|works)|"
    r"hold (a|that) (time|slot)"
    r")\b",
    re.I,
)


def booking_tools_allowed(history: list[dict[str, str]], user_text: str) -> bool:
    """Keep calendar tools off until they clearly want a time — not merely 'a meeting'."""
    if _BOOKING_INTENT_RE.search(user_text or ""):
        return True
    user_turns = sum(1 for turn in history if turn.get("role") == "user")
    return user_turns >= 4


async def _speak_stream(ws: WebSocket, reply: str) -> None:
    """Speak a completed reply in small chunks for ConversationRelay TTS."""
    reply = _cap_reply(reply.strip() or "Sorry — could you repeat that?")
    buffer = ""
    for ch in reply:
        buffer += ch
        if any(buffer.endswith(p) for p in (" ", ".", "!", "?", ",", ";", ":")) or len(buffer) >= 24:
            await send_text(ws, buffer, last=False)
            buffer = ""
    await send_text(ws, buffer if buffer else " ", last=True)


async def speak(ws: WebSocket, reply: str, call_context: dict[str, Any] | None = None) -> None:
    """Speak via cloned ElevenLabs play, or catalog ConversationRelay TTS."""
    text = _cap_reply((reply or "").strip() or "Sorry — could you repeat that?")
    cloned = str((call_context or {}).get("clonedVoiceId") or "").strip()
    if cloned:
        url = await asyncio.to_thread(synthesize_cloned_mp3, cloned, text)
        if url:
            await send_play(ws, url)
            return
        log.warning("cloned TTS failed — falling back to catalog voice")
    await _speak_stream(ws, text)


_GENERIC_BOOKING_GOAL_RE = re.compile(
    r"^(book(\s+(a|the))?\s+(call|calls|meeting|meetings)|schedule(\s+a)?\s+(call|meeting)|meetings?|discovery(\s+call)?)\.?$",
    re.I,
)


def is_generic_booking_goal(text: str) -> bool:
    t = (text or "").strip()
    if not t:
        return True
    if t.lower() == (
        "company overview products services pricing faq hours support what we do"
    ):
        return True
    return bool(_GENERIC_BOOKING_GOAL_RE.match(t))


async def stream_reply(
    ws: WebSocket,
    history: list[dict[str, str]],
    system: str,
    user_text: str,
    call_context: dict[str, Any] | None = None,
    *,
    allow_tools: bool | None = None,
) -> str:
    history.append({"role": "user", "content": user_text})
    ctx = call_context or {}
    if not openai_client:
        reply = "Thanks for calling. Please try again later."
        history.append({"role": "assistant", "content": reply})
        await speak(ws, reply, ctx)
        return reply

    tools_configured = bool(resolve_api_base() and AARVANTA_CALLBACK_SECRET)
    if allow_tools is None:
        allow_tools = tools_configured and booking_tools_allowed(history, user_text)
    else:
        allow_tools = bool(allow_tools) and tools_configured
    # OpenAI message list may include tool rounds (not just plain chat turns).
    messages: list[dict[str, Any]] = [{"role": "system", "content": system}, *history]

    for _round in range(MAX_TOOL_ROUNDS + 1):
        kwargs: dict[str, Any] = {
            "model": OPENAI_MODEL,
            "messages": messages,
            "max_tokens": MAX_REPLY_TOKENS,
            "temperature": REPLY_TEMPERATURE,
            "frequency_penalty": REPLY_FREQUENCY_PENALTY,
            "presence_penalty": REPLY_PRESENCE_PENALTY,
        }
        if allow_tools:
            kwargs["tools"] = BOOKING_TOOLS
            kwargs["tool_choice"] = "auto"

        completion = await asyncio.to_thread(
            lambda: openai_client.chat.completions.create(**kwargs)  # type: ignore[arg-type]
        )
        choice = completion.choices[0].message
        tool_calls = choice.tool_calls or []

        if tool_calls and allow_tools:
            if not ctx.get("calendarFillerSpoken"):
                await speak(ws, "One sec.", ctx)
                ctx["calendarFillerSpoken"] = True

            assistant_msg: dict[str, Any] = {
                "role": "assistant",
                "content": choice.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments or "{}",
                        },
                    }
                    for tc in tool_calls
                ],
            }
            messages.append(assistant_msg)

            for tc in tool_calls:
                raw_args = tc.function.arguments or "{}"
                try:
                    args = json.loads(raw_args)
                    if not isinstance(args, dict):
                        args = {}
                except json.JSONDecodeError:
                    args = {}
                log.info("tool call name=%s args=%s", tc.function.name, args)
                result = await asyncio.to_thread(
                    execute_booking_tool, tc.function.name, args, ctx
                )
                if tc.function.name == "book_meeting" and result.get("meeting"):
                    ctx["lastBooking"] = result["meeting"]
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": json.dumps(result)[:4000],
                    }
                )
            continue

        reply = (choice.content or "").strip() or "Sorry — could you repeat that?"
        reply = _dedupe_against_history(reply, history)
        reply = _humanize_spoken(reply)
        reply = _cap_reply(reply)
        await speak(ws, reply, ctx)
        history.append({"role": "assistant", "content": reply})
        if len(history) > 16:
            del history[:-16]
        return reply

    reply = "Sorry — I had trouble with the calendar. Can we try another time?"
    await speak(ws, reply, ctx)
    history.append({"role": "assistant", "content": reply})
    return reply


async def say_goodbye_and_hangup(
    ws: WebSocket,
    transcript: list[dict[str, str]],
    call_context: dict[str, Any] | None = None,
) -> None:
    goodbye = "Sounds good. Take care — goodbye."
    await speak(ws, goodbye, call_context)
    transcript.append({"role": "assistant", "content": goodbye})
    await asyncio.sleep(_speech_seconds(goodbye))
    await end_session(ws, json.dumps({"reason": "caller_ended"}))


def infer_call_conclusion(turns: list[dict[str, str]], summary: str, outcome: str) -> dict[str, Any]:
    text = f"{summary} " + " ".join(t.get("content", "") for t in turns)
    blob = text.lower()
    next_action = "none"
    info_to_send = None
    if outcome == "meeting_booked":
        next_action = "meeting"
    elif outcome in {"not_interested", "wrong_number", "spam", "already_using_competitor"}:
        next_action = "none"
    elif outcome in {"callback_requested", "bad_timing"} or re.search(
        r"\b(call back|callback|call me (back|later|tomorrow)|another time)\b", blob
    ):
        next_action = "callback"
    elif re.search(r"\b(send|email|share)\b", blob) and re.search(
        r"\b(info|information|details|deck|one-?pager|overview|pricing)\b", blob
    ):
        next_action = "send_info"
        match = re.search(
            r"(?:send|email|share)\s+(?:me\s+)?(?:the\s+)?(.{8,120}?)(?:\.|$)",
            text,
            re.I,
        )
        if match:
            info_to_send = match.group(1).strip()[:400]
    elif outcome == "need_follow_up" or "follow up" in blob or "follow-up" in blob:
        next_action = "follow_up"
    elif re.search(r"\b(interested|sounds good|tell me more)\b", blob):
        next_action = "qualify_lead"

    promised_at = None
    notes = (summary or "")[:500] or None
    return {
        "nextAction": next_action,
        "promisedAt": promised_at,
        "infoToSend": info_to_send,
        "notes": notes,
    }


def post_transcript(session: dict[str, Any], turns: list[dict[str, str]], summary: str) -> None:
    if not AARVANTA_CALLBACK_URL or not AARVANTA_CALLBACK_SECRET:
        return
    params = session.get("customParameters") or {}
    text_blob = " ".join(t.get("content", "") for t in turns).lower()
    outcome = "completed"
    booked = bool((session.get("callContext") or {}).get("lastBooking"))
    if booked or (
        "meeting" in text_blob
        and any(w in text_blob for w in ("book", "confirm", "scheduled", "see you"))
    ):
        outcome = "meeting_booked"
    elif "not interested" in text_blob:
        outcome = "not_interested"
    elif "call back" in text_blob or "callback" in text_blob:
        outcome = "callback_requested"
    sentiment = "positive" if outcome == "meeting_booked" else "neutral"
    conclusion = infer_call_conclusion(turns, summary, outcome)
    payload = {
        key: value
        for key, value in {
            "callSid": session.get("callSid"),
            "from": session.get("from"),
            "to": session.get("to"),
            "conversationId": params.get("conversationId"),
            "direction": params.get("direction"),
            "sessionId": params.get("sessionId"),
            "campaignId": params.get("campaignId"),
            "queueId": params.get("queueId"),
            "contactId": params.get("contactId"),
            "turns": turns,
            "summary": summary,
            "outcome": outcome,
            "sentiment": sentiment,
            "intent": "Interested" if outcome == "meeting_booked" else None,
            "nextAction": conclusion["nextAction"],
            "promisedAt": conclusion["promisedAt"],
            "infoToSend": conclusion["infoToSend"],
            "conclusionNotes": conclusion["notes"],
        }.items()
        if value is not None
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
            "version": SERVICE_VERSION,
            "openai": bool(OPENAI_API_KEY),
            "signatureVerification": VERIFY_SIGNATURES and bool(TWILIO_AUTH_TOKEN),
            "wssUrlConfigured": bool(VOICE_RELAY_WSS_URL),
            "callbackConfigured": bool(AARVANTA_CALLBACK_URL and AARVANTA_CALLBACK_SECRET),
            "contextConfigured": bool(resolve_context_url() and AARVANTA_CALLBACK_SECRET),
            "toolsEnabled": bool(resolve_api_base() and AARVANTA_CALLBACK_SECRET),
            "maxReplyTokens": MAX_REPLY_TOKENS,
            "maxReplyChars": MAX_REPLY_CHARS,
            "temperature": REPLY_TEMPERATURE,
            "frequencyPenalty": REPLY_FREQUENCY_PENALTY,
            "presencePenalty": REPLY_PRESENCE_PENALTY,
            "brand": BRAND_NAME,
            "clonedTts": bool(ELEVENLABS_API_KEY and resolve_tts_public_base()),
            "elevenLabsApiKeyConfigured": bool(ELEVENLABS_API_KEY),
        }
    )


@app.get("/tts/{filename}", response_model=None)
async def tts_file(filename: str) -> FileResponse | PlainTextResponse:
    if not re.fullmatch(r"[a-f0-9]{16,64}\.mp3", filename):
        return PlainTextResponse("not found", status_code=404)
    path = TTS_DIR / filename
    if not path.is_file():
        return PlainTextResponse("not found", status_code=404)
    return FileResponse(path, media_type="audio/mpeg")


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
    call_context: dict[str, Any] = {}
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

                context = await asyncio.to_thread(fetch_voice_context, params, session)
                knowledge_digest = str(context.get("knowledgeDigest") or "")
                system = build_system_prompt(
                    params,
                    business_name=BRAND_NAME,
                    knowledge_digest=knowledge_digest,
                    context=context,
                )
                session["context"] = context
                call_context = {
                    "contactId": (
                        str(context.get("contactId") or params.get("contactId") or "")
                        .strip()
                    ),
                    "sessionId": (
                        str(context.get("sessionId") or params.get("sessionId") or "")
                        .strip()
                    ),
                    "campaignId": (
                        str(context.get("campaignId") or params.get("campaignId") or "")
                        .strip()
                    ),
                    "voiceAgentName": str(context.get("voiceAgentName") or "Ava"),
                    "timezone": "America/New_York",
                    "clonedVoiceId": str(
                        params.get("clonedVoiceId")
                        or context.get("clonedVoiceId")
                        or ""
                    ).strip(),
                }
                session["callContext"] = call_context
                direction = str(params.get("direction") or "").lower()
                log.info(
                    "setup callSid=%s from=%s direction=%s brand=%s knowledge=%s contact=%s tools=%s clone=%s",
                    session.get("callSid"),
                    session.get("from"),
                    direction or "-",
                    BRAND_NAME,
                    "yes" if knowledge_digest else "no",
                    call_context.get("contactId") or "-",
                    "yes" if resolve_api_base() and AARVANTA_CALLBACK_SECRET else "no",
                    "yes" if call_context.get("clonedVoiceId") else "no",
                )
                skip_opening = str(params.get("skipOpening") or "").strip().lower() in (
                    "1",
                    "true",
                    "yes",
                )
                notice = str(context.get("recordingNotice") or "").strip()
                if notice and call_context.get("clonedVoiceId") and not skip_opening:
                    try:
                        await speak(websocket, notice, call_context)
                    except Exception as exc:  # noqa: BLE001
                        log.warning("recording notice play failed: %s", exc)
                # TwiML welcomeGreeting already spoke identity + a time check.
                # Do not run an LLM opening (that was the ~20s delay + instant booking).
                if skip_opening:
                    log.info("skipping relay opening — TwiML already greeted")
                else:
                    opening_instruction = (
                        OUTBOUND_OPENING_INSTRUCTION
                        if direction.startswith("outbound")
                        else INBOUND_OPENING_INSTRUCTION
                    )
                    agent_name = str(call_context.get("voiceAgentName") or "Ava")
                    try:
                        opening = await stream_reply(
                            websocket,
                            history,
                            system,
                            opening_instruction,
                            call_context,
                            allow_tools=False,
                        )
                        # Drop the synthetic instruction from history; keep the
                        # assistant's opening so the conversation flows naturally.
                        if len(history) >= 2 and history[-2]["role"] == "user":
                            del history[-2]
                        transcript.append({"role": "assistant", "content": opening})
                    except Exception as exc:  # noqa: BLE001
                        log.exception("opening line failed: %s", exc)
                        if direction.startswith("outbound"):
                            fallback = (
                                f"Hi, this is {agent_name} calling from {BRAND_NAME}. "
                                "Do you have a moment?"
                            )
                        else:
                            fallback = (
                                f"Hi, thanks for calling {BRAND_NAME}. "
                                f"This is {agent_name} — how can I help?"
                            )
                        await speak(websocket, fallback, call_context)
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
                    await say_goodbye_and_hangup(websocket, transcript, call_context)
                    break

                try:
                    reply = await stream_reply(
                        websocket, history, system, prompt, call_context
                    )
                except Exception as exc:  # noqa: BLE001
                    log.exception("OpenAI failed: %s", exc)
                    reply = "Sorry, I am having trouble right now."
                    await speak(websocket, reply, call_context)
                transcript.append({"role": "assistant", "content": reply})

                # If the model said goodbye, hang up after TTS starts
                if re.search(r"\b(goodbye|bye for now|have a (good|great) day)\b", reply, re.I):
                    await asyncio.sleep(_speech_seconds(reply))
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
