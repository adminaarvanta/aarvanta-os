export type TwilioVoiceStatus = {
  callSid: string;
  phone: string;
  direction: "inbound" | "outbound";
  durationSeconds: number;
  status: string;
  summary: string;
};

const TRACKED_STATUSES = new Set([
  "initiated",
  "ringing",
  "answered",
  "in-progress",
  "completed",
  "busy",
  "no-answer",
  "canceled",
  "failed",
]);

/**
 * Parse Twilio voice status callbacks for inbound and outbound calls.
 * Outbound: customer is `To`. Inbound: customer is `From`.
 * Phone may be empty — callers should still look up the session by CallSid.
 */
export function parseTwilioVoiceStatus(
  params: Record<string, string>
): TwilioVoiceStatus | null {
  const callSid = params.CallSid;
  const status = params.CallStatus?.trim().toLowerCase();
  if (!callSid || !status) return null;
  if (!TRACKED_STATUSES.has(status)) return null;

  const rawDirection = (params.Direction ?? params.CallDirection ?? "")
    .trim()
    .toLowerCase();
  const isOutbound =
    rawDirection.startsWith("outbound") ||
    rawDirection === "outbound-api" ||
    rawDirection === "outbound-dial";

  const phone = (isOutbound ? params.To : params.From)?.trim() ?? "";

  const duration = Number(params.CallDuration ?? params.DialCallDuration ?? "0");
  const durationSeconds = Number.isFinite(duration) ? duration : 0;
  const direction: "inbound" | "outbound" = isOutbound ? "outbound" : "inbound";

  const summary =
    status === "completed"
      ? `${direction === "outbound" ? "Outbound" : "Inbound"} call (${durationSeconds}s)`
      : `${direction === "outbound" ? "Outbound" : "Inbound"} call — ${status}`;

  return {
    callSid,
    phone,
    direction,
    durationSeconds,
    status,
    summary,
  };
}
