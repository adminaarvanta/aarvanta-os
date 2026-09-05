import { EmailTemplatesLibrary } from "@/app/(app)/outreach/templates/templates-library";
import {
  EmailBackLink,
  EmailPageShell,
} from "@/components/outreach/email-os-ui";
import { getEmailOutreachRepository } from "@/lib/data/email-outreach-store";
import { listEmailStarterTemplates } from "@/lib/email-outreach/starter-templates";
import { getTenantScope } from "@/lib/tenant/context";

export default async function EmailTemplatesPage() {
  const scope = await getTenantScope();
  const templates = await getEmailOutreachRepository().listTemplates(scope);
  const starters = listEmailStarterTemplates();

  return (
    <EmailPageShell
      title="Templates"
      description="Starter HTML emails and your saved library. Apply into a new campaign or paste your own in the composer."
      back={<EmailBackLink href="/outreach" label="Email OS" />}
    >
      <EmailTemplatesLibrary starters={starters} templates={templates} />
    </EmailPageShell>
  );
}

export const metadata = { title: "Email OS · Templates" };
