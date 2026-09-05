import { EmailCampaignComposer } from "@/components/outreach/campaign-composer";
import { EmailBackLink, EmailPageShell } from "@/components/outreach/email-os-ui";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";

type Props = {
  searchParams: Promise<{ template?: string }>;
};

export default async function NewEmailCampaignPage({ searchParams }: Props) {
  const scope = await getTenantScope();
  const { template } = await searchParams;
  const contacts = await getCrmRepository().listContacts(scope);

  return (
    <EmailPageShell
      title="New campaign"
      description="Write or paste HTML, preview with merge samples, then save or start sending."
      back={<EmailBackLink href="/outreach/campaigns" label="All campaigns" />}
    >
      <EmailCampaignComposer
        contacts={contacts}
        initialTemplateId={template}
      />
    </EmailPageShell>
  );
}

export const metadata = { title: "Email OS · New campaign" };
