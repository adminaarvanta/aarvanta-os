import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api/request";
import { getRepository } from "@/lib/data/repository";
import { getWebhookTenantScope } from "@/lib/tenant/context";

/**
 * Voice relay (EC2) posts call transcripts here after ConversationRelay disconnects.
 * Auth: X-Voice-Relay-Secret === VOICE_RELAY_CALLBACK_SECRET
 */
const schema = z.object({
  callSid: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  conversationId: z.string().optional(),
  direction: z.string().optional(),
  summary: z.string().optional(),
  turns: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .default([]),
});

export async function POST(req: Request) {
  const expected = process.env.VOICE_RELAY_CALLBACK_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "VOICE_RELAY_CALLBACK_SECRET not configured" },
      { status: 503 }
    );
  }

  const secret = req.headers.get("x-voice-relay-secret")?.trim();
  if (!secret || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const scope = getWebhookTenantScope();
  const repo = getRepository();
  const { conversationId, from, to, direction, turns, summary, callSid } =
    parsed.data;

  const phone =
    (direction?.toLowerCase().startsWith("outbound") ? to : from) ||
    from ||
    to;

  let conversation = conversationId
    ? await repo.getConversation(conversationId, scope)
    : null;

  if (!conversation && phone) {
    conversation = await repo.findConversationByPhone(phone, scope);
  }

  if (!conversation && phone) {
    conversation = await repo.ensurePhoneConversation(
      { phone, channel: "voice" },
      scope
    );
  }

  if (!conversation) {
    return NextResponse.json({ error: "No conversation found" }, { status: 404 });
  }

  const transcriptText = turns
    .map((t) => `${t.role === "user" ? "Caller" : "Aarvanta"}: ${t.content}`)
    .join("\n");

  const noteBody = [
    summary ? `AI call summary: ${summary}` : "AI voice call completed",
    callSid ? `CallSid: ${callSid}` : null,
    transcriptText ? `\nTranscript:\n${transcriptText}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await repo.addInternalNote(
    conversation.id,
    { content: noteBody.slice(0, 8000) },
    scope,
    { name: "Voice Relay", id: "voice-relay" }
  );

  return NextResponse.json({
    ok: true,
    conversationId: conversation.id,
    turns: turns.length,
  });
}
