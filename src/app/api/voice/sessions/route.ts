import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

export async function GET(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as
    | "ringing"
    | "in_progress"
    | "completed"
    | "failed"
    | null;
  const campaignId = url.searchParams.get("campaignId") ?? undefined;

  const sessions = await getCallingAgentRepository().listSessions(scope, {
    ...(status ? { status } : {}),
    ...(campaignId ? { campaignId } : {}),
  });
  const contacts = await getCrmRepository().listContacts(scope);
  const contactById = new Map(contacts.map((c) => [c.id, c]));

  return NextResponse.json({
    sessions: sessions.map((s) => {
      const contact = s.contactId ? contactById.get(s.contactId) : undefined;
      return {
        ...s,
        contactName: contact ? contactDisplayName(contact) : undefined,
        phone: contact?.phone,
        jobTitle: contact?.jobTitle,
      };
    }),
  });
}
