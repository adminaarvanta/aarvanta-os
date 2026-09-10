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
  isSurgicalRefine,
  markLatestUserRefine,
  type BuildGenerateMode,
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

function takeGenerateMode(body: unknown): {
  mode?: BuildGenerateMode;
  prefs: unknown;
} {
  if (!body || typeof body !== "object") return { prefs: body };
  const rec = body as Record<string, unknown>;
  const raw = rec.mode;
  const mode =
    raw === "refine" || raw === "generate" || raw === "regenerate"
      ? raw
      : undefined;
  const prefs = { ...rec };
  delete prefs.mode;
  return { mode, prefs };
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

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const { mode, prefs } = takeGenerateMode(body);
  const latestRefine =
    prefs && typeof prefs === "object"
      ? (prefs as { refineInstructions?: string }).refineInstructions?.trim()
      : undefined;
  const surgical = isSurgicalRefine(mode, job, latestRefine);

  try {
    const { requireBuildGenerate } = await import("@/lib/billing/consume");
    await requireBuildGenerate(scope, job, { allowRefine: surgical });
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

  // Allow empty body to regenerate with existing preferences
  const library = await getSiteMediaRepository().listByJob(id, scope);
  let working: SiteBuildJob = withClientMediaRefs(job, library);
  if (prefs && typeof prefs === "object" && Object.keys(prefs as object).length > 0) {
    const parsed = sitePreferencesSchema.safeParse(prefs);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.message } },
        { status: 400 }
      );
    }
    const incoming = normalizeSitePreferences(parsed.data);
    const isRefine = Boolean(latestRefine && job.generatedSite);

    // Surgical edits apply this turn only — prior edits already live on the tree.
    const accumulated =
      isRefine && !surgical
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
        if (!surgical) {
          const { consumeCredits } = await import("@/lib/billing/consume");
          const siteType = working.preferences.siteType;
          const tariff =
            siteType === "landing" ? "generate_landing" : "generate_website";
          await consumeCredits(scope, tariff);
        }

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
              refineLastResult: working.refineLastResult,
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
          refineLastResult:
            resultJob.refineLastResult ?? working.refineLastResult,
        };

        const outcome = saved.refineLastResult;
        const isRefineTurn = Boolean(
          latestRefine && (working.preferences.refineInstructions?.trim() || outcome)
        );

        if (isRefineTurn) {
          const changed = outcome?.changed ?? false;
          const summary =
            outcome?.summary ??
            (changed
              ? "Applied your changes to the site."
              : "Could not apply — try naming the page or quoting the new text.");
          saved = markLatestUserRefine(saved, {
            status: changed ? "applied" : "failed",
            resultVersion: saved.generatedSite?.version,
            applied: changed,
          });
          saved = appendRefineTurn(saved, {
            role: "assistant",
            content: summary,
            status: changed ? "applied" : "failed",
            resultVersion: saved.generatedSite?.version,
          });
        }

        await repo.save(saved);
        send({
          type: "complete",
          job: saved,
          usedAi: saved.usedAi ?? false,
          refineApplied: outcome?.changed ?? false,
          refineSummary: outcome?.summary,
        });
      } catch (error) {
        const { isPlanEntitlementError } = await import("@/lib/billing/errors");
        const message =
          error instanceof Error ? error.message : "Generation failed.";
        let failed: SiteBuildJob = {
          ...working,
          status: surgical ? working.status : "failed",
          generatedSite: surgical ? working.generatedSite : working.generatedSite,
          error: surgical ? undefined : message,
          updatedAt: crmNow(),
        };
        if (working.preferences.refineInstructions?.trim()) {
          failed = markLatestUserRefine(failed, { status: "failed", applied: false });
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
