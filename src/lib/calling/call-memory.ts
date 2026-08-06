import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import type { TenantScope } from "@/types/communication";

/** Compact memory injected into the voice agent before each campaign call. */
export async function buildCallMemorySummary(
  contactId: string,
  scope: TenantScope
): Promise<string> {
  const [sessions, activities, meetings] = await Promise.all([
    getCallingAgentRepository().listSessions(scope, { contactId }),
    getCrmRepository().listActivities(scope, { contactId }),
    getCallingAgentRepository().listMeetings(scope, { leadId: contactId }),
  ]);

  const parts: string[] = [];
  const prior = sessions
    .filter((s) => s.status === "completed")
    .slice(0, 3);

  for (const s of prior) {
    if (s.summary) {
      parts.push(`Prior call: ${s.summary}`);
    } else if (s.outcome) {
      parts.push(`Prior outcome: ${s.outcome}`);
    }
    if (s.qualification) {
      const q = s.qualification;
      const flags = [
        q.interested ? "interested" : null,
        q.painPoint ? "pain noted" : null,
        q.decisionMaker ? "decision maker" : null,
        q.budget ? "budget awareness" : null,
      ].filter(Boolean);
      if (flags.length) parts.push(`Qualification: ${flags.join(", ")}`);
    }
  }

  const objections = prior
    .flatMap((s) => s.aiDecisions ?? [])
    .filter((d) => /object|competitor|not interested|busy/i.test(d))
    .slice(0, 3);
  if (objections.length) {
    parts.push(`Objections/notes: ${objections.join("; ")}`);
  }

  const openMeeting = meetings.find((m) => m.status === "scheduled");
  if (openMeeting) {
    parts.push(
      `Existing meeting: ${openMeeting.meetingStart} (${openMeeting.timezone})`
    );
  }

  const recentNotes = activities
    .filter((a) => a.type === "note" || a.type === "call")
    .slice(0, 2)
    .map((a) => a.title);
  if (recentNotes.length) {
    parts.push(`CRM notes: ${recentNotes.join("; ")}`);
  }

  return parts.join(" | ").slice(0, 900);
}
