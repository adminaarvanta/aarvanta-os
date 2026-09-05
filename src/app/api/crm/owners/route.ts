import { NextResponse } from "next/server";
import { z } from "zod";
import { crmNewId } from "@/lib/data/crm-helpers";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const createSchema = z.object({
  name: z.string().trim().min(1),
});

function ownerEmail(name: string, userId: string) {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 40) || "owner";
  const suffix = userId.replace(/[^a-z0-9]/gi, "").slice(-8) || "new";
  return `${slug}.${suffix}@owners.crm.local`;
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

  const name = parsed.data.name.trim();
  const repo = getTenantRepository();
  const existing = (await repo.listMembers(ctx.scope)).find(
    (member) =>
      member.status === "active" &&
      member.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (existing) {
    return NextResponse.json({
      owner: {
        userId: existing.userId,
        name: existing.name,
        email: existing.email,
      },
    });
  }

  const userId = crmNewId("user");
  const member = await repo.createMember(
    {
      userId,
      email: ownerEmail(name, userId),
      name,
      role: "member",
    },
    ctx.scope
  );

  return NextResponse.json(
    {
      owner: {
        userId: member.userId,
        name: member.name,
        email: member.email,
      },
    },
    { status: 201 }
  );
}
