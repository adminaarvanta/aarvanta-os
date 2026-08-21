import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api/request";
import { handlePlanError } from "@/lib/billing/api-guard";
import { requireFeature } from "@/lib/billing/consume";
import { isDemoClonedVoiceId } from "@/lib/channels/cloned-voice";
import {
  defaultPreviewText,
  elevenLabsConfigured,
  synthesizeElevenLabsMp3,
} from "@/lib/channels/elevenlabs-voices";
import { isDemoMode } from "@/lib/config/app-mode";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getWorkspaceSettings } from "@/lib/settings/workspace-settings";
import { getSessionContext } from "@/lib/tenant/context";

export const runtime = "nodejs";
export const maxDuration = 30;

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
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
  const agent = await getCallingAgentRepository().getAgent(id, ctx.scope);
  if (!agent) {
    return apiError("NOT_FOUND", "Voice agent not found", 404);
  }

  const cloned = agent.clonedVoice;
  if (!cloned || cloned.status !== "ready" || !cloned.elevenLabsVoiceId) {
    return apiError("NO_CLONE", "This agent has no cloned voice yet.", 400);
  }

  if (isDemoMode() || isDemoClonedVoiceId(cloned.elevenLabsVoiceId)) {
    return apiError(
      "DEMO_PREVIEW",
      "Demo mode simulates a clone. Live calls still use the workspace catalog voice.",
      400
    );
  }

  if (!elevenLabsConfigured()) {
    return apiError(
      "ELEVENLABS_NOT_CONFIGURED",
      "ELEVENLABS_API_KEY is required to preview a cloned voice.",
      503
    );
  }

  const settings = await getWorkspaceSettings(ctx.scope.workspaceId);
  const text = defaultPreviewText(
    agent.greetingName ?? agent.name,
    settings.businessName
  );

  try {
    const audio = await synthesizeElevenLabsMp3({
      voiceId: cloned.elevenLabsVoiceId,
      text,
    });
    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "Content-Disposition": 'inline; filename="voice-preview.mp3"',
      },
    });
  } catch (error) {
    return apiError(
      "PREVIEW_FAILED",
      error instanceof Error ? error.message : "Preview failed",
      502
    );
  }
}
