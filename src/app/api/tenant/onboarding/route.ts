import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { crmNow } from "@/lib/data/crm-helpers";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext, requirePermission } from "@/lib/tenant/context";
import { guessWebsiteFromEmail } from "@/lib/onboarding/catalog";
import { buildLaunchpadSnapshot } from "@/lib/onboarding/launchpad";
import type { OrganizationOnboarding } from "@/types/tenant";

export const runtime = "nodejs";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  website: z.string().max(200).optional(),
  useCase: z
    .enum(["own_business", "agency", "internal_team", "exploring"])
    .optional(),
  industry: z.string().min(1).max(80).optional(),
  customerCountRange: z
    .enum(["1-10", "11-50", "51-200", "200+", "none_yet"])
    .optional(),
  tools: z.array(z.string().max(60)).max(20).optional(),
  complete: z.boolean().optional(),
  dismissLaunchpad: z.boolean().optional(),
});

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

    const parsed = patchSchema.safeParse(body);
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
