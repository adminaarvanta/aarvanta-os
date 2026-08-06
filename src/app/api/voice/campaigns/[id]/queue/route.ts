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
  const repo = getCallingAgentRepository();
  const campaign = await repo.getCampaign(id, scope);
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [queue, contacts, companies] = await Promise.all([
    repo.listQueue(scope, { campaignId: id }),
    getCrmRepository().listContacts(scope),
    getCrmRepository().listCompanies(scope),
  ]);

  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const companyById = new Map(companies.map((c) => [c.id, c]));

  const items = queue.map((item) => {
    const contact = contactById.get(item.contactId);
    const company = contact?.accountId
      ? companyById.get(contact.accountId)
      : undefined;
    return {
      ...item,
      contactName: contact ? contactDisplayName(contact) : item.contactId,
      companyName: company?.name,
      leadScore: contact?.leadScore,
      phone: contact?.phone,
    };
  });

  return NextResponse.json({ queue: items });
}
