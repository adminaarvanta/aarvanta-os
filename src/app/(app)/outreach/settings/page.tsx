import { TestSendForm } from "@/components/outreach/test-send-form";
import { EmailPageShell, EmailPanel } from "@/components/outreach/email-os-ui";
import {
  checkBrevoAccount,
  getBrevoRuntimeStatus,
} from "@/lib/channels/brevo-client";

export default async function EmailOutreachSettingsPage() {
  const runtime = getBrevoRuntimeStatus();
  const account = await checkBrevoAccount();

  return (
    <EmailPageShell
      title="Settings"
      subtitle="Brevo connection, sender identity, and a one-off test send"
      tone="cyan"
    >
      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <EmailPanel title="Brevo connection" tone="cyan">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">
                {runtime.mode === "smtp" ? "SMTP key" : "API key"}
              </dt>
              <dd className="font-medium">
                {runtime.configured ? "Configured" : "Not set"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Account check</dt>
              <dd className="font-medium capitalize">{account.replace("_", " ")}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Sender</dt>
              <dd className="text-right font-medium">
                {runtime.sender.name}
                <br />
                <span className="text-xs text-muted">{runtime.sender.email}</span>
              </dd>
            </div>
            <div>
              <dt className="text-muted">Webhook</dt>
              <dd className="mt-1 break-all text-xs text-foreground">
                {runtime.webhookUrl ?? "Set NEXT_PUBLIC_APP_URL"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">
            Set BREVO_SMTP_KEY or BREVO_API_KEY, plus sender and webhook secret.
            SMTP keys (xsmtpsib-…) send via smtp-relay.brevo.com.
          </p>
        </EmailPanel>

        <EmailPanel title="Test send" tone="navy">
          <TestSendForm />
        </EmailPanel>
      </div>
    </EmailPageShell>
  );
}

export const metadata = { title: "Email OS · Settings" };
