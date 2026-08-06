import { NextResponse } from "next/server";
import { sendMeetingConfirmationEmail } from "@/lib/calling/meeting-email";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { crmNow } from "@/lib/data/crm-helpers";

export const runtime = "nodejs";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repo = getCallingAgentRepository();
  const due = await repo.listDueReminders(crmNow());
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const job of due) {
    const scope = {
      tenantId: job.tenantId,
      workspaceId: job.workspaceId,
      companyId: job.companyId,
    };
    try {
      const meeting = await repo.getMeeting(job.meetingBookingId, scope);
      if (!meeting || meeting.status === "cancelled") {
        await repo.updateReminder(job.id, { status: "cancelled" }, scope);
        results.push({ id: job.id, ok: true });
        continue;
      }
      const contact = await getCrmRepository().getContact(meeting.leadId, scope);
      if (!contact) {
        await repo.updateReminder(
          job.id,
          { status: "failed", error: "Contact missing" },
          scope
        );
        results.push({ id: job.id, ok: false, error: "Contact missing" });
        continue;
      }
      await sendMeetingConfirmationEmail(meeting, contact, scope, {
        reminder: true,
      });
      await repo.updateReminder(
        job.id,
        { status: "sent", sentAt: crmNow() },
        scope
      );
      results.push({ id: job.id, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";
      await repo.updateReminder(
        job.id,
        { status: "failed", error: message },
        scope
      );
      results.push({ id: job.id, ok: false, error: message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
