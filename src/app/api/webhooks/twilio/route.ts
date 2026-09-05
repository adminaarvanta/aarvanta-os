import { NextResponse } from "next/server";
import { resolveVoiceCallingConfig } from "@/lib/channels/voice-calling-config";
import { isProductionMode } from "@/lib/config/app-mode";
import { getRepository } from "@/lib/data/repository";
import { getWorkspaceSettings } from "@/lib/settings/workspace-settings";
import { getWebhookTenantScope } from "@/lib/tenant/context";
import {
  isWebhookProcessed,
  markWebhookProcessed,
} from "@/lib/webhooks/idempotency";
import { parseTwilioSms, verifyTwilioSignature } from "@/lib/webhooks/twilio";
import { closeCallSession } from "@/lib/calling/close-call-session";
import { spokenTurnCount } from "@/lib/calling/stale-call-session";
import { parseTwilioVoiceStatus } from "@/lib/webhooks/twilio-voice";

async function parseTwilioBody(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  const rawBody = await req.text();

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(rawBody);
    const data: Record<string, string> = {};
    params.forEach((value, key) => {
      data[key] = value;
    });
    return { data, rawBody };
  }

  const data =
    rawBody.length > 0
      ? (JSON.parse(rawBody) as Record<string, string>)
      : {};
  return { data, rawBody };
}

async function startInboundRecording(callSid: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!accountSid || !authToken || !appUrl) return;

  const recordingCallback = `${appUrl.replace(/\/$/, "")}/api/webhooks/twilio/recording`;
  const body = new URLSearchParams({
    RecordingChannels: "dual",
    RecordingStatusCallback: recordingCallback,
    RecordingStatusCallbackMethod: "POST",
  });
  body.append("RecordingStatusCallbackEvent", "completed");

  await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}/Recordings.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  ).catch((err) => {
    console.error("[twilio] inbound recording start failed", err);
  });
}

export async function POST(req: Request) {
  const { data } = await parseTwilioBody(req);

  if (isProductionMode()) {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      return NextResponse.json(
        { error: "Twilio auth token not configured" },
        { status: 500 }
      );
    }

    const signature = req.headers.get("x-twilio-signature");
    const url = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`
      : req.url;

    if (!verifyTwilioSignature(authToken, signature, url, data)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const scope = getWebhookTenantScope();
  const repo = getRepository();

  const sms = parseTwilioSms(data);
  if (sms) {
    if (await isWebhookProcessed("twilio_sms", sms.messageId)) {
      return NextResponse.json({ received: true, processed: 0, duplicate: true });
    }

    await repo.addInboundMessage(
      { phone: sms.phone, channel: "sms", content: sms.content },
      scope
    );
    await markWebhookProcessed("twilio_sms", sms.messageId, scope);
    return NextResponse.json({ received: true, processed: 1, type: "sms" });
  }

  // Inbound answered: optionally start recording (ConversationRelay path)
  const callStatus = data.CallStatus?.trim().toLowerCase();
  const callSidEarly = data.CallSid?.trim();
  if (callSidEarly && (callStatus === "in-progress" || callStatus === "answered")) {
    const rawDirection = (data.Direction ?? "").toLowerCase();
    const isInbound = !rawDirection.startsWith("outbound");
    if (isInbound) {
      const settings = await getWorkspaceSettings(scope.workspaceId);
      const voice = resolveVoiceCallingConfig(settings);
      if (voice.callRecordingEnabled) {
        const key = `recstart:${callSidEarly}`;
        if (!(await isWebhookProcessed("twilio_voice_rec_start", key))) {
          await startInboundRecording(callSidEarly);
          await markWebhookProcessed("twilio_voice_rec_start", key, scope);
        }
      }
    }
  }

  const call = parseTwilioVoiceStatus(data);
  if (call) {
    const eventKey = `${call.callSid}:${call.status}`;
    if (await isWebhookProcessed("twilio_voice", eventKey)) {
      return NextResponse.json({ received: true, processed: 0, duplicate: true });
    }

    const terminal = [
      "completed",
      "busy",
      "failed",
      "no-answer",
      "canceled",
    ].includes(call.status);

    if (terminal && call.phone) {
      if (call.direction === "outbound") {
        let conversation = await repo.findConversationByPhone(call.phone, scope);
        if (!conversation) {
          conversation = await repo.ensurePhoneConversation(
            { phone: call.phone, channel: "voice" },
            scope
          );
        }
        const patched = await repo.patchCallBySid(
          conversation.id,
          call.callSid,
          {
            summary: call.summary,
            durationSeconds: call.durationSeconds,
          },
          scope
        );
        if (!patched) {
          await repo.addOutboundCall(
            conversation.id,
            {
              summary: call.summary,
              durationSeconds: call.durationSeconds,
              callSid: call.callSid,
            },
            scope
          );
        }
      } else {
        await repo.addInboundCall(
          {
            phone: call.phone,
            durationSeconds: call.durationSeconds,
            summary: call.summary,
            callSid: call.callSid,
          },
          scope
        );
      }
    }

    try {
      const { getCallingAgentRepository } = await import(
        "@/lib/data/calling-agent-store"
      );
      const calling = getCallingAgentRepository();
      const session = await calling.getSessionByCallSid(call.callSid, scope);
      if (session) {
        if (call.status === "answered" || call.status === "in-progress") {
          if (session.status === "ringing") {
            await calling.updateSession(
              session.id,
              { status: "in_progress", callSid: call.callSid },
              scope
            );
          }
        } else if (
          call.status === "busy" ||
          call.status === "no-answer" ||
          call.status === "failed" ||
          call.status === "canceled"
        ) {
          const outcome =
            call.status === "busy"
              ? ("busy" as const)
              : call.status === "no-answer"
                ? ("no_answer" as const)
                : ("failed" as const);
          await closeCallSession({
            scope,
            session,
            outcome,
            summary: call.summary,
            durationSeconds: call.durationSeconds || session.durationSeconds,
          });
        } else if (call.status === "completed") {
          const spoken = spokenTurnCount(session);
          if ((call.durationSeconds ?? 0) === 0 && spoken === 0) {
            await closeCallSession({
              scope,
              session,
              outcome: "no_answer",
              summary: call.summary || "Call completed without connecting.",
              durationSeconds: 0,
            });
          } else if ((call.durationSeconds ?? 0) > 0) {
            await calling.updateSession(
              session.id,
              {
                callSid: call.callSid,
                durationSeconds: call.durationSeconds,
              },
              scope
            );
          }
        }
      }
    } catch (err) {
      console.warn("[twilio] session sync failed", err);
    }

    await markWebhookProcessed("twilio_voice", eventKey, scope);

    if (call.status === "completed" && call.durationSeconds > 0) {
      try {
        const minutes = Math.max(1, Math.ceil(call.durationSeconds / 60));
        const { consumeVoiceMinutes } = await import("@/lib/billing/consume");
        await consumeVoiceMinutes(scope, minutes);
      } catch (error) {
        console.warn(
          "[billing] voice minute consume failed",
          error instanceof Error ? error.message : error
        );
      }
    }

    return NextResponse.json({
      received: true,
      processed: 1,
      type: "voice",
      direction: call.direction,
    });
  }

  return NextResponse.json({ received: true, processed: 0 });
}
