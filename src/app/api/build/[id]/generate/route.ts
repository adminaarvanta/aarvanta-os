import { NextResponse } from "next/server";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import {
  generateSitePlan,
  updateSitePreferences,
} from "@/lib/site-builder/orchestrate";
import { normalizeSitePreferences } from "@/lib/site-builder/normalize-preferences";
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

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  // Allow empty body to regenerate with existing preferences
  let working: SiteBuildJob = job;
  if (body && typeof body === "object" && Object.keys(body as object).length > 0) {
    const parsed = sitePreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: parsed.error.message } },
        { status: 400 }
      );
    }
    working = updateSitePreferences(job, normalizeSitePreferences(parsed.data));
    await repo.save(working);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(encodeSse(payload)));
      };

      try {
        send({
          type: "progress",
          stage: "business",
          percent: 0,
          message: "Starting…",
        });

        const result = await generateSitePlan(working, async (event: PipelineProgressEvent) => {
          const progressJob: SiteBuildJob = {
            ...working,
            status: "generating",
            preferences: {
              ...working.preferences,
              businessProfile: event.partial?.business ?? working.preferences.businessProfile,
              brandSystem: event.partial?.brand ?? working.preferences.brandSystem,
              pageCandidates:
                event.partial?.pageCandidates ?? working.preferences.pageCandidates,
            },
            plan: event.partial?.plan ?? working.plan,
            generatedSite: event.partial?.site ?? working.generatedSite,
            progress: {
              stage: event.stage,
              percent: event.percent,
              message: event.message,
              updatedAt: crmNow(),
            },
            updatedAt: crmNow(),
          };
          working = progressJob;
          // Persist mid-flight so UI polling also works
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
        });

        await repo.save(result);
        send({
          type: "complete",
          job: result,
          usedAi: result.usedAi ?? false,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Generation failed.";
        const failed: SiteBuildJob = {
          ...working,
          status: "failed",
          error: message,
          updatedAt: crmNow(),
        };
        await repo.save(failed);
        send({ type: "error", message, job: failed });
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
