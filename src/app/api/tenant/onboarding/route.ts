import { NextResponse } from "next/server";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { crmNow } from "@/lib/data/crm-helpers";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext, requirePermission } from "@/lib/tenant/context";
import { guessWebsiteFromEmail } from "@/lib/onboarding/catalog";
import { buildLaunchpadSnapshot } from "@/lib/onboarding/launchpad";
import { parseOnboardingPatch } from "@/lib/onboarding/onboarding-patch";
import { setWorkspaceSettings } from "@/lib/settings/workspace-settings";
import type { OrganizationOnboarding } from "@/types/tenant";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const repo = getTenantRepository();
    const org = await repo.getOrganization(ctx.scope.tenantId);
    if (!org) return apiError("NOT_FOUND", "Organization not found", 404);

    const launchpad = await buildLaunchpadSnapshot(ctx.scope);
    return NextResponse.json({
      organization: {
        id: org.id,
        name: org.name,
        onboarding: org.onboarding ?? null,
      },
      suggestedWebsite: guessWebsiteFromEmail(ctx.email),
      firstName: (ctx.name || ctx.email).split(" ")[0],
      email: ctx.email,
      launchpad,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError(
      "TENANT_ERROR",
      message,
      message === "Unauthorized" ? 401 : 500
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await requirePermission("org:manage");
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = parseOnboardingPatch(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid onboarding payload", 400);
    }

    const repo = getTenantRepository();
    const org = await repo.getOrganization(ctx.scope.tenantId);
    if (!org) return apiError("NOT_FOUND", "Organization not found", 404);

    const now = crmNow();
    const current: OrganizationOnboarding = org.onboarding ?? {
      status: "pending",
    };
    const nextOnboarding: OrganizationOnboarding = { ...current };

    if (parsed.data.website !== undefined) {
      nextOnboarding.website = parsed.data.website.trim();
    }
    if (parsed.data.useCase) nextOnboarding.useCase = parsed.data.useCase;
    if (parsed.data.industry) nextOnboarding.industry = parsed.data.industry;
    if (parsed.data.customerCountRange) {
      nextOnboarding.customerCountRange = parsed.data.customerCountRange;
    }
    if (parsed.data.tools) nextOnboarding.tools = parsed.data.tools;
    if (parsed.data.primaryGoal !== undefined) {
      nextOnboarding.primaryGoal = parsed.data.primaryGoal.trim();
    }
    if (parsed.data.startingWorkflow) {
      nextOnboarding.startingWorkflow = parsed.data.startingWorkflow;
    }
    if (parsed.data.connectSkipped) nextOnboarding.connectSkipped = true;
    if (parsed.data.sampleDataOptIn !== undefined) {
      nextOnboarding.sampleDataOptIn = parsed.data.sampleDataOptIn;
    }
    if (parsed.data.complete) {
      nextOnboarding.status = "complete";
      nextOnboarding.completedAt = now;
    }
    if (parsed.data.dismissLaunchpad) {
      nextOnboarding.launchpadDismissedAt = now;
    }

    const updated = await repo.updateOrganization(ctx.scope.tenantId, {
      ...(parsed.data.name ? { name: parsed.data.name.trim() } : {}),
      onboarding: nextOnboarding,
    });
    if (!updated) return apiError("NOT_FOUND", "Organization not found", 404);

    if (parsed.data.timezone || parsed.data.currency) {
      await setWorkspaceSettings(ctx.scope.workspaceId, {
        ...(parsed.data.timezone ? { timezone: parsed.data.timezone } : {}),
        ...(parsed.data.currency ? { defaultCurrency: parsed.data.currency } : {}),
      });
    }

    return NextResponse.json({
      organization: {
        id: updated.id,
        name: updated.name,
        onboarding: updated.onboarding ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status =
      message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return apiError("TENANT_ERROR", message, status);
  }
}
