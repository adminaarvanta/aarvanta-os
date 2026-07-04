import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getLaunchRepository } from "@/lib/data/launch-store";
import { deployLaunchSession } from "@/lib/launch/deploy";
import { getTenantScope } from "@/lib/tenant/context";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
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

  if (session.status === "deployed") {
    return NextResponse.json(
      { error: { code: "ALREADY_DEPLOYED", message: "Session already deployed" } },
      { status: 409 }
    );
  }

  try {
    const result = await deployLaunchSession(session, scope);
    await getLaunchRepository().save(result.session);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deployment failed";
    return NextResponse.json(
      { error: { code: "DEPLOY_FAILED", message } },
      { status: 500 }
    );
  }
}
