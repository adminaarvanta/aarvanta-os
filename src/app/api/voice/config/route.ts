import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody, unauthorized } from "@/lib/api/request";
import {
  getWorkspaceSettings,
  setWorkspaceSettings,
} from "@/lib/settings/workspace-settings";
import { getSessionContext } from "@/lib/tenant/context";

const patchSchema = z.object({
  voiceTtsProvider: z.enum(["ElevenLabs", "Amazon", "Google"]).optional(),
  voiceId: z.string().max(200).optional().nullable(),
  voiceLanguage: z.string().min(2).max(16).optional(),
  voiceCustomId: z.string().max(200).optional().nullable(),
  callRecordingEnabled: z.boolean().optional(),
  callRecordingAnnounce: z.boolean().optional(),
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
