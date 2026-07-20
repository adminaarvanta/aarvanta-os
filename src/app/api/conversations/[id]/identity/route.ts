import { NextResponse } from "next/server";
import { z } from "zod";
import { detectConversationIdentity } from "@/lib/identity/detect-entity-type";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getRepository } from "@/lib/data/repository";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

const bodySchema = z.object({
  override: z.enum(["company", "individual"]).nullable().optional(),
  redetect: z.boolean().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const repo = getRepository();
  const conversation = await repo.getConversation(id, scope);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const crm = getCrmRepository();
  const [contacts, companies] = await Promise.all([
    crm.listContacts(scope),
    crm.listCompanies(scope),
  ]);

  let working = conversation;
  if (parsed.data.override !== undefined) {
    working = {
      ...conversation,
      identity: {
        type: parsed.data.override ?? conversation.identity?.type ?? "unknown",
        confidence: parsed.data.override ? 1 : conversation.identity?.confidence ?? 0,
        signals: conversation.identity?.signals ?? [],
        override: parsed.data.override ?? undefined,
        suggestedCompanyName: conversation.identity?.suggestedCompanyName,
        suggestedDomain: conversation.identity?.suggestedDomain,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  const identity = detectConversationIdentity(working, { contacts, companies });
  const updated = await repo.updateIdentity(id, identity, scope);
  return NextResponse.json({ conversation: updated, identity });
}
