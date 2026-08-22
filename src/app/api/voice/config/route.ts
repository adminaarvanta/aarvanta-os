import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody, unauthorized } from "@/lib/api/request";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import {
  getWorkspaceSettings,
  setWorkspaceSettings,
} from "@/lib/settings/workspace-settings";
import { getSessionContext } from "@/lib/tenant/context";

const patchSchema = z.object({
  voiceTtsProvider: z.enum(["ElevenLabs", "Amazon", "Google"]).optional(),
  voiceId: z.string().max(200).optional().nullable(),
  voiceLanguage: z.string().min(2).max(24).optional(),
  voiceCustomId: z.string().max(200).optional().nullable(),
  callRecordingEnabled: z.boolean().optional(),
  callRecordingAnnounce: z.boolean().optional(),
  voicePrimaryAgentId: z.string().max(80).optional().nullable(),
});

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const settings = await getWorkspaceSettings(ctx.scope.workspaceId);
    return NextResponse.json({
      settings: {
        voiceTtsProvider: settings.voiceTtsProvider,
        voiceId: settings.voiceId,
        voiceLanguage: settings.voiceLanguage,
        voiceCustomId: settings.voiceCustomId,
        callRecordingEnabled: settings.callRecordingEnabled ?? false,
        callRecordingAnnounce: settings.callRecordingAnnounce !== false,
        voicePrimaryAgentId: settings.voicePrimaryAgentId,
      },
    });
  } catch {
    return unauthorized();
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await getSessionContext();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid voice config", 400);
    }

    const d = parsed.data;
    const primaryId = d.voicePrimaryAgentId?.trim() || undefined;
    if (primaryId) {
      const agent = await getCallingAgentRepository().getAgent(
        primaryId,
        ctx.scope
      );
      if (!agent) {
        return apiError("NOT_FOUND", "Voice agent not found", 404);
      }
    }

    const settings = await setWorkspaceSettings(ctx.scope.workspaceId, {
      ...(d.voiceTtsProvider != null ? { voiceTtsProvider: d.voiceTtsProvider } : {}),
      ...(d.voiceLanguage != null ? { voiceLanguage: d.voiceLanguage } : {}),
      ...(d.voiceId !== undefined
        ? { voiceId: d.voiceId?.trim() || undefined }
        : {}),
      ...(d.voiceCustomId !== undefined
        ? { voiceCustomId: d.voiceCustomId?.trim() || undefined }
        : {}),
      ...(d.callRecordingEnabled != null
        ? { callRecordingEnabled: d.callRecordingEnabled }
        : {}),
      ...(d.callRecordingAnnounce != null
        ? { callRecordingAnnounce: d.callRecordingAnnounce }
        : {}),
      ...(d.voicePrimaryAgentId !== undefined
        ? { voicePrimaryAgentId: primaryId }
        : {}),
    });

    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return apiError(
      "VOICE_CONFIG_ERROR",
      message,
      message === "Unauthorized" ? 401 : 500
    );
  }
}
