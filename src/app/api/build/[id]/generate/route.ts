import { NextResponse } from "next/server";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import { getSiteMediaRepository } from "@/lib/data/site-media-store";
import { withClientMediaRefs } from "@/lib/site-builder/sync-client-media";
import {
  generateSitePlan,
  updateSitePreferences,
} from "@/lib/site-builder/orchestrate";
import { normalizeSitePreferences } from "@/lib/site-builder/normalize-preferences";
import {
  accumulateRefineInstructions,
  appendRefineTurn,
  markLatestUserRefine,
} from "@/lib/site-builder/refine-history";
import { sitePreferencesSchema } from "@/lib/site-builder/schemas";
import { crmNow } from "@/lib/data/crm-helpers";
import { getTenantScope } from "@/lib/tenant/context";
import type { PipelineProgressEvent } from "@/lib/site-builder/agents/pipeline";
import type { SiteBuildJob } from "@/types/site-builder";

type RouteContext = { params: Promise<{ id: string }> };

function encodeSse(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request, context: RouteContext) {
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

  try {
    const { requireBuildGenerate } = await import("@/lib/billing/consume");
    await requireBuildGenerate(scope, job);
  } catch (error) {
    const { isPlanEntitlementError, planErrorStatus } = await import(
      "@/lib/billing/errors"
    );
    if (isPlanEntitlementError(error)) {
      return NextResponse.json(
        { error: error.toJSON() },
        { status: planErrorStatus(error) }
      );
    }
    throw error;
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  // Allow empty body to regenerate with existing preferences
  const library = await getSiteMediaRepository().listByJob(id, scope);
  let working: SiteBuildJob = withClientMediaRefs(job, library);
  if (body && typeof body === "object" && Object.keys(body as object).length > 0) {
    const parsed = sitePreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.message } },
        { status: 400 }
      );
    }
    const incoming = normalizeSitePreferences(parsed.data);
    const latestRefine = incoming.refineInstructions?.trim();
    const isRefine = Boolean(latestRefine && job.generatedSite);

    // Compound prior applied turns + this prompt so multi-step edits stick.
    const accumulated = isRefine
      ? accumulateRefineInstructions(job.refineChat, latestRefine)
      : latestRefine;

    working = updateSitePreferences(
      working,
      {
        ...incoming,
        refineInstructions: accumulated ?? incoming.refineInstructions,
        designOptions: incoming.designOptions?.length
          ? incoming.designOptions
          : job.preferences.designOptions,
        selectedDesignOptionId:
          incoming.selectedDesignOptionId ??
          job.preferences.selectedDesignOptionId,
        businessProfile:
          incoming.businessProfile ?? job.preferences.businessProfile,
        brandSystem: incoming.brandSystem ?? job.preferences.brandSystem,
      },
      { preserveGenerated: isRefine }
    );

    working = withClientMediaRefs(working, library);

    if (isRefine && latestRefine) {
      working = appendRefineTurn(working, {
        role: "user",
        content: latestRefine,
        applied: true,
        status: "pending",
      });
    }

    await repo.save(working);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(encodeSse(payload)));
      };

      try {
        const { consumeCredits } = await import("@/lib/billing/consume");
        const siteType = working.preferences.siteType;
        const tariff =
          siteType === "landing" ? "generate_landing" : "generate_website";
        await consumeCredits(scope, tariff);

        send({
          type: "progress",
          stage: "business",
          percent: 0,
          message: "Starting…",
        });

        const resultJob = await generateSitePlan(
          working,
          async (event: PipelineProgressEvent) => {
            const progressJob: SiteBuildJob = {
              ...working,
              status: "generating",
              preferences: {
                ...working.preferences,
                businessProfile:
                  event.partial?.business ?? working.preferences.businessProfile,
                brandSystem:
                  event.partial?.brand ?? working.preferences.brandSystem,
                pageCandidates:
                  event.partial?.pageCandidates ??
                  working.preferences.pageCandidates,
              },
              plan: event.partial?.plan ?? working.plan,
              // Keep prior preview until a newer partial site arrives
              generatedSite:
                event.partial?.site ?? working.generatedSite,
              refineChat: working.refineChat,
              progress: {
                stage: event.stage,
                percent: event.percent,
                message: event.message,
                updatedAt: crmNow(),
              },
              updatedAt: crmNow(),
            };
            working = progressJob;
            if (event.percent % 20 < 8 || event.stage === "done") {
              await repo.save(progressJob);
            }

            send({
              type: "progress",
              stage: event.stage,
              percent: event.percent,
              message: event.message,
              partial: event.partial
                ? {
                    business: event.partial.business,
                    brand: event.partial.brand,
                    pageCandidates: event.partial.pageCandidates,
                    hasPlan: Boolean(event.partial.plan),
                    hasSite: Boolean(event.partial.site),
                    site: event.partial.site,
                    plan: event.partial.plan,
                  }
                : undefined,
            });
          }
        );

        let saved: SiteBuildJob = {
          ...resultJob,
          refineChat: working.refineChat ?? resultJob.refineChat,
        };

        if (working.preferences.refineInstructions?.trim()) {
          saved = markLatestUserRefine(saved, {
            status: "applied",
            resultVersion: saved.generatedSite?.version,
            applied: true,
          });
          saved = appendRefineTurn(saved, {
            role: "assistant",
            content: "Applied your changes to the site.",
            status: "applied",
            resultVersion: saved.generatedSite?.version,
          });
        }

        await repo.save(saved);
        send({
          type: "complete",
          job: saved,
          usedAi: saved.usedAi ?? false,
        });
      } catch (error) {
        const { isPlanEntitlementError } = await import("@/lib/billing/errors");
        const message =
          error instanceof Error ? error.message : "Generation failed.";
        let failed: SiteBuildJob = {
          ...working,
          status: "failed",
          error: message,
          updatedAt: crmNow(),
        };
        if (working.preferences.refineInstructions?.trim()) {
          failed = markLatestUserRefine(failed, { status: "failed" });
          failed = appendRefineTurn(failed, {
            role: "assistant",
            content: `Could not apply that change: ${message}`,
            status: "failed",
          });
        }
        await repo.save(failed);
        send({
          type: "error",
          message,
          job: failed,
          ...(isPlanEntitlementError(error)
            ? { code: error.code, upgradeHint: error.upgradeHint }
            : {}),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
