import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api/request";
import { getKnowledgeRepository } from "@/lib/data/knowledge-store";
import { searchKnowledgeChunks } from "@/lib/knowledge/search";
import { getWorkspaceSettings } from "@/lib/settings/workspace-settings";
import { getWebhookTenantScope } from "@/lib/tenant/context";

/**
 * Voice relay (EC2) fetches company knowledge at ConversationRelay setup.
 * Auth: X-Voice-Relay-Secret === VOICE_RELAY_CALLBACK_SECRET
 */
const schema = z.object({
  conversationId: z.string().optional(),
  direction: z.string().optional(),
  topic: z.string().max(2000).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const DIGEST_MAX_CHARS = 1800;
const DEFAULT_TOPIC =
  "company overview products services pricing FAQ hours support what we do";

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

  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const scope = getWebhookTenantScope();
  const settings = await getWorkspaceSettings(scope.workspaceId);
  const businessName = settings.businessName?.trim() || "Aarvanta";

  const repo = getKnowledgeRepository();
  const chunks = await repo.listChunks(scope);
  const topic = parsed.data.topic?.trim() || DEFAULT_TOPIC;

  let knowledgeDigest = "";
  if (chunks.length) {
    const hits = await searchKnowledgeChunks(chunks, topic, 6);
    if (hits.length) {
      const parts: string[] = [];
      let used = 0;
      for (const hit of hits) {
        const title = hit.chunk.documentTitle?.trim() || "Document";
        const content = hit.chunk.content.trim().replace(/\s+/g, " ");
        const block = `[${title}] ${content}`;
        if (used + block.length + 2 > DIGEST_MAX_CHARS) {
          const room = DIGEST_MAX_CHARS - used - 2;
          if (room > 80) {
            parts.push(block.slice(0, room) + "…");
          }
          break;
        }
        parts.push(block);
        used += block.length + 2;
      }
      knowledgeDigest = parts.join("\n\n");
    }
  }

  return NextResponse.json({
    businessName,
    knowledgeDigest,
    chunkCount: chunks.length,
  });
}
