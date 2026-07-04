import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateRulePack } from "@/lib/rules/evaluate";
import { listAllRulePacks, resolveRulePackForIntent } from "@/lib/rules/resolve-pack";
import { resolveRulePack } from "@/lib/rules/packs/uk-default";
import { getSessionContext } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const evaluateSchema = z.object({
  packId: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  context: z.record(z.string(), z.unknown()),
});

export async function GET() {
  try {
    await getSessionContext();
  } catch {
    return unauthorized();
  }

  return NextResponse.json({
    packs: listAllRulePacks(),
  });
}

export async function POST(req: Request) {
  try {
    await getSessionContext();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = evaluateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const allPacks = listAllRulePacks();
  const pack =
    (parsed.data.packId
      ? allPacks.find((p) => p.id === parsed.data.packId)
      : null) ??
    (parsed.data.context.intent && typeof parsed.data.context.intent === "string"
      ? resolveRulePackForIntent(parsed.data.context.intent, {
          country: parsed.data.country,
          industry: parsed.data.industry,
        })
      : resolveRulePack({
          country: parsed.data.country,
          industry: parsed.data.industry,
        }));

  const results = evaluateRulePack(pack, parsed.data.context);
  return NextResponse.json({ pack: { id: pack.id, label: pack.label }, results });
}
