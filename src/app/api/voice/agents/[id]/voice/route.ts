import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api/request";
import { handlePlanError } from "@/lib/billing/api-guard";
import { requireFeature } from "@/lib/billing/consume";
import { promoteVoiceAgentAfterClone } from "@/lib/calling/resolve-voice-agent";
import { demoClonedVoiceId } from "@/lib/channels/cloned-voice";
import {
  collectCloneFiles,
  createInstantVoiceClone,
  deleteElevenLabsVoice,
  elevenLabsConfigured,
} from "@/lib/channels/elevenlabs-voices";
import { isDemoMode } from "@/lib/config/app-mode";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { crmNow } from "@/lib/data/crm-helpers";
import { getSessionContext } from "@/lib/tenant/context";
import type { ClonedVoice } from "@/types/calling-agent";

export const runtime = "nodejs";
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

function formFlag(form: FormData, key: string): boolean | undefined {
  const raw = form.get(key);
  if (typeof raw !== "string") return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "on" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "off" || v === "no") return false;
  return undefined;
}

function consentGiven(form: FormData): boolean {
  return formFlag(form, "consent") === true;
}

export async function POST(req: Request, { params }: Params) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  try {
    await requireFeature(ctx.scope, "voiceAi", "lite");
  } catch (error) {
    const planRes = handlePlanError(error);
    if (planRes) return planRes;
    throw error;
  }

  const { id } = await params;
  const repo = getCallingAgentRepository();
  const agent = await repo.getAgent(id, ctx.scope);
  if (!agent) {
    return apiError("NOT_FOUND", "Voice agent not found", 404);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return apiError("VALIDATION_ERROR", "Expected multipart form data", 400);
  }

  if (!consentGiven(form)) {
    return apiError(
      "CONSENT_REQUIRED",
      "Confirm you have the right and consent to clone this voice.",
      400
    );
  }

  let files: File[];
  try {
    files = collectCloneFiles(form);
  } catch (error) {
    return apiError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "Invalid audio upload",
      400
    );
  }

  const nameFromForm = form.get("name");
  const cloneName =
    (typeof nameFromForm === "string" && nameFromForm.trim()) ||
    `${agent.greetingName ?? agent.name} clone`;
  const now = crmNow();
  const previousId = agent.clonedVoice?.elevenLabsVoiceId;

  if (isDemoMode()) {
    const clonedVoice: ClonedVoice = {
      elevenLabsVoiceId: demoClonedVoiceId(agent.id),
      name: cloneName,
      status: "ready",
      consentAt: now,
      createdAt: now,
      previewText: "Demo clone — live calls still use the workspace catalog voice.",
    };
    const updated = await repo.updateAgent(id, { clonedVoice }, ctx.scope);
    await promoteVoiceAgentAfterClone(
      ctx.scope.workspaceId,
      id,
      formFlag(form, "setPrimary")
    );
    return NextResponse.json({ agent: updated, demo: true });
  }

  if (!elevenLabsConfigured()) {
    return apiError(
      "ELEVENLABS_NOT_CONFIGURED",
      "ELEVENLABS_API_KEY is required to clone a voice in production.",
      503
    );
  }

  try {
    if (previousId) {
      await deleteElevenLabsVoice(previousId).catch(() => undefined);
    }
    const cloned = await createInstantVoiceClone({
      name: cloneName,
      files,
      description: `Aarvanta Voice Agent ${agent.id}`,
      labels: {
        workspaceId: ctx.scope.workspaceId,
        agentId: agent.id,
        tenantId: ctx.scope.tenantId,
      },
    });
    const clonedVoice: ClonedVoice = {
      elevenLabsVoiceId: cloned.voiceId,
      name: cloneName,
      status: "ready",
      consentAt: now,
      createdAt: now,
    };
    const updated = await repo.updateAgent(id, { clonedVoice }, ctx.scope);
    await promoteVoiceAgentAfterClone(
      ctx.scope.workspaceId,
      id,
      formFlag(form, "setPrimary")
    );
    return NextResponse.json({
      agent: updated,
      demo: false,
      requiresVerification: cloned.requiresVerification,
    });
  } catch (error) {
    const clonedVoice: ClonedVoice = {
      elevenLabsVoiceId: previousId ?? "",
      name: cloneName,
      status: "failed",
      consentAt: now,
      createdAt: now,
    };
    if (previousId) {
      await repo.updateAgent(id, { clonedVoice }, ctx.scope).catch(() => null);
    }
    return apiError(
      "CLONE_FAILED",
      error instanceof Error ? error.message : "Voice clone failed",
      502
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  try {
    await requireFeature(ctx.scope, "voiceAi", "lite");
  } catch (error) {
    const planRes = handlePlanError(error);
    if (planRes) return planRes;
    throw error;
  }

  const { id } = await params;
  const repo = getCallingAgentRepository();
  const agent = await repo.getAgent(id, ctx.scope);
  if (!agent) {
    return apiError("NOT_FOUND", "Voice agent not found", 404);
  }

  const previousId = agent.clonedVoice?.elevenLabsVoiceId;
  try {
    if (previousId) await deleteElevenLabsVoice(previousId);
  } catch (error) {
    return apiError(
      "CLONE_DELETE_FAILED",
      error instanceof Error ? error.message : "Could not delete cloned voice",
      502
    );
  }

  const updated = await repo.updateAgent(id, { clonedVoice: null }, ctx.scope);
  return NextResponse.json({ agent: updated, demo: isDemoMode() });
}
