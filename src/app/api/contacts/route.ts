import { NextResponse } from "next/server";
import { z } from "zod";
import { recordMutationEvent } from "@/lib/api/mutation-events";
import { getCrmRepository } from "@/lib/data/crm-store";
import { validateAgainstRules } from "@/lib/rules/validate-mutation";
import { getSessionContext, getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  accountId: z.string().optional(),
  tags: z
    .array(
      z.enum([
        "hot_lead",
        "vip",
        "customer",
        "prospect",
        "partner",
        "follow_up",
      ])
    )
    .optional(),
  notes: z.string().optional(),
  ownerId: z.string().optional(),
});

export async function GET() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const contacts = await getCrmRepository().listContacts(scope);
  return NextResponse.json({ contacts });
}

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ruleCheck = validateAgainstRules({ contact: parsed.data });
  if (!ruleCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RULE_VIOLATION", message: ruleCheck.message, ruleId: ruleCheck.ruleId } },
      { status: 422 }
    );
  }

  const contact = await getCrmRepository().createContact(parsed.data, ctx.scope);
  await recordMutationEvent({
    ctx,
    type: "contact.created",
    entityType: "contact",
    entityId: contact.id,
    payload: {
      name: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
    },
  });

  return NextResponse.json({ contact }, { status: 201 });
}
