import { NextResponse } from "next/server";
import { listScheduledCallsForContact } from "@/lib/calling/scheduled-call-store";
import { slotsFromSettings } from "@/lib/calling/schedule-slots";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { unauthorized } from "@/lib/api/request";
import { getWorkspaceSettings } from "@/lib/settings/workspace-settings";
import { getSessionContext } from "@/lib/tenant/context";
import { VOICE_TASK_AGENT } from "@/types/calling-agent";

export const runtime = "nodejs";

export async function GET(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const contactId = new URL(req.url).searchParams.get("contactId")?.trim();
  if (!contactId) {
    return NextResponse.json({ error: "contactId required" }, { status: 400 });
  }

  const crm = getCrmRepository();
  const contact = await crm.getContact(contactId, ctx.scope);
  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [sessions, scheduled, tasks, activities, settings] = await Promise.all([
    getCallingAgentRepository().listSessions(ctx.scope, { contactId }),
    listScheduledCallsForContact(contactId, ctx.scope, contact.phone),
    crm.listTasks(ctx.scope, { contactId }),
    crm.listActivities(ctx.scope, { contactId }),
    getWorkspaceSettings(ctx.scope.workspaceId),
  ]);

  const lastSession =
    [...sessions]
      .sort(
        (a, b) =>
          new Date(b.endedAt ?? b.startedAt).getTime() -
          new Date(a.endedAt ?? a.startedAt).getTime()
      )
      .find((s) => s.status === "completed" || Boolean(s.outcome)) ?? null;

  const nextCall =
    scheduled.find((c) => c.status === "scheduled" || c.status === "calling") ??
    null;

  const openTasks = tasks.filter(
    (t) => t.assignedAgentType === VOICE_TASK_AGENT && t.status !== "done"
  );
  const emails = activities.filter((a) =>
    /^Emailed |Could not email/i.test(a.title)
  );

  return NextResponse.json({
    lastSession,
    nextCall,
    openTasks,
    emails,
    timeZone: slotsFromSettings(settings).timeZone,
    missingEmail: !contact.email,
  });
}
