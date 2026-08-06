import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const session = await getCallingAgentRepository().getSession(id, scope);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contact = session.contactId
    ? await getCrmRepository().getContact(session.contactId, scope)
    : null;
  const company =
    contact?.accountId
      ? await getCrmRepository().getCompany(contact.accountId, scope)
      : null;

  return NextResponse.json({
    session: {
      ...session,
      contactName: contact ? contactDisplayName(contact) : undefined,
      phone: contact?.phone,
      jobTitle: contact?.jobTitle,
      companyName: company?.name,
    },
  });
}
