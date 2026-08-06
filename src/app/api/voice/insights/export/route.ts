import { unauthorized } from "@/lib/api/request";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

export async function GET() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const [queue, sessions, contacts] = await Promise.all([
    getCallingAgentRepository().listQueue(scope),
    getCallingAgentRepository().listSessions(scope),
    getCrmRepository().listContacts(scope),
  ]);
  const contactById = new Map(contacts.map((c) => [c.id, c]));

  const lines = [
    "type,id,contact,status,outcome,attempts,startedAt",
  ];

  for (const q of queue) {
    const contact = contactById.get(q.contactId);
    lines.push(
      [
        "queue",
        q.id,
        contact ? contactDisplayName(contact) : q.contactId,
        q.status,
        q.lastOutcome ?? "",
        String(q.attemptCount),
        q.lastAttemptAt ?? "",
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  for (const s of sessions) {
    const contact = s.contactId ? contactById.get(s.contactId) : null;
    lines.push(
      [
        "session",
        s.id,
        contact ? contactDisplayName(contact) : s.contactId ?? "",
        s.status,
        s.outcome ?? "",
        "",
        s.startedAt,
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="voice-os-calling-export.csv"',
    },
  });
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
