export function parseSimulatedEmailEvent(payload: unknown): Array<{
  messageId: string;
  from: string;
  subject: string;
  to: string[];
  body: string;
  rfcMessageId?: string;
}> {
  const results: Array<{
    messageId: string;
    from: string;
    subject: string;
    to: string[];
    body: string;
    rfcMessageId?: string;
  }> = [];

  if (!payload || typeof payload !== "object") return results;

  const record = payload as {
    simulate?: boolean;
    from?: string;
    subject?: string;
    text?: string;
    body?: string;
    to?: string | string[];
    messageId?: string;
    message_id?: string;
  };

  if (!record.simulate || !record.from) return results;

  const body = (record.text ?? record.body ?? "").trim();
  if (!body) return results;

  const toRaw = record.to;
  const to = Array.isArray(toRaw)
    ? toRaw.map(parseEmailAddress)
    : toRaw
      ? [parseEmailAddress(toRaw)]
      : [];

  results.push({
    messageId: record.messageId ?? `sim_${Date.now()}`,
    from: parseEmailAddress(record.from),
    subject: record.subject ?? "(no subject)",
    to,
    body,
    rfcMessageId: record.message_id,
  });

  return results;
}

function parseEmailAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim().toLowerCase();
}
