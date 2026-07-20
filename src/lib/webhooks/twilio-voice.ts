export type TwilioVoiceStatus = {
  callSid: string;
  phone: string;
  direction: "inbound" | "outbound";
  durationSeconds: number;
  status: string;
  summary: string;
};

/**
 * Parse Twilio voice status callbacks for inbound and outbound calls.
 * Outbound: customer is `To`. Inbound: customer is `From`.
 */
export function parseTwilioVoiceStatus(
  params: Record<string, string>
): TwilioVoiceStatus | null {
  const callSid = params.CallSid;
  const status = params.CallStatus?.trim().toLowerCase();
  if (!callSid || !status) return null;

  const terminal = new Set([
    "completed",
    "busy",
    "no-answer",
    "canceled",
    "failed",
  ]);
  if (!terminal.has(status)) return null;

  const rawDirection = (params.Direction ?? params.CallDirection ?? "")
    .trim()
    .toLowerCase();
  const isOutbound =
    rawDirection.startsWith("outbound") ||
    rawDirection === "outbound-api" ||
    rawDirection === "outbound-dial";

  const phone = (isOutbound ? params.To : params.From)?.trim();
  if (!phone) return null;

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
