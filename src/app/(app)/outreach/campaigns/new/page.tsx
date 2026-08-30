import { EmailCampaignComposer } from "@/components/outreach/campaign-composer";
import { EmailBackLink, EmailPageShell } from "@/components/outreach/email-os-ui";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function NewEmailCampaignPage() {
  const scope = await getTenantScope();
  const contacts = await getCrmRepository().listContacts(scope);

  return (
    <EmailPageShell
      title="New campaign"
      subtitle="Write the email, choose CRM contacts, then save or start sending"
      tone="cyan"
      actions={<EmailBackLink href="/outreach/campaigns">All campaigns</EmailBackLink>}
    >
      <EmailCampaignComposer contacts={contacts} />
    </EmailPageShell>
  );
}

export const metadata = { title: "Email OS · New campaign" };
