import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import { approveSitePlan } from "@/lib/site-builder/orchestrate";
import { getTenantScope } from "@/lib/tenant/context";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteContext) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id } = await context.params;
  const repo = getSiteBuildRepository();
  const job = await repo.get(id, scope);
  if (!job) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Build job not found." } },
      { status: 404 }
    );
  }

  if (job.status !== "plan_ready" || !job.plan) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_STATE",
          message: "Site plan must be ready before approval.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const approved = approveSitePlan(job);
    await repo.save(approved);
    return NextResponse.json({ job: approved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approval failed.";
    return NextResponse.json(
      { error: { code: "APPROVE_FAILED", message } },
      { status: 400 }
    );
  }
}
