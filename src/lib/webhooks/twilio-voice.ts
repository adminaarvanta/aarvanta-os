export function parseTwilioVoiceStatus(params: Record<string, string>) {
  const callSid = params.CallSid;
  const from = params.From;
  const status = params.CallStatus;
  const duration = Number(params.CallDuration ?? params.DialCallDuration ?? "0");

  if (!callSid || !from) return null;

  if (status !== "completed" && status !== "busy" && status !== "no-answer") {
    return null;
  }

  return {
    callSid,
    phone: from,
    durationSeconds: Number.isFinite(duration) ? duration : 0,
    summary:
      status === "completed"
        ? `Inbound call (${duration}s)`
        : `Inbound call — ${status}`,
  };
}
