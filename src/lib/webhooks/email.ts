export function parseResendWebhookEvent(payload: unknown): Array<{
  messageId: string;
  from: string;
  subject: string;
  to: string[];
  rfcMessageId?: string;
}> {
  const results: Array<{
    messageId: string;
    from: string;
    subject: string;
    to: string[];
    rfcMessageId?: string;
  }> = [];

  if (!payload || typeof payload !== "object") return results;

  const record = payload as {
    type?: string;
    data?: {
      email_id?: string;
      from?: string;
      subject?: string;
      to?: string[];
      message_id?: string;
    };
  };

  if (record.type !== "email.received" || !record.data?.email_id) return results;

  results.push({
    messageId: record.data.email_id,
    from: parseEmailAddress(record.data.from ?? ""),
    subject: record.data.subject ?? "(no subject)",
    to: (record.data.to ?? []).map(parseEmailAddress),
    rfcMessageId: record.data.message_id,
  });

  return results;
}

function parseEmailAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim().toLowerCase();
}
