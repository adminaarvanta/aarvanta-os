import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getLaunchRepository } from "@/lib/data/launch-store";
import { getTenantScope } from "@/lib/tenant/context";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const session = await getLaunchRepository().get(id, scope);
  if (!session) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Launch session not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ session });
}
