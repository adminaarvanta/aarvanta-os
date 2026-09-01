import { CheckCircle2, CircleAlert, Mail } from "lucide-react";
import { TestSendForm } from "@/components/outreach/test-send-form";
import { EmailPageShell, EmailSection } from "@/components/outreach/email-os-ui";
import {
  checkBrevoAccount,
  getBrevoRuntimeStatus,
} from "@/lib/channels/brevo-client";

export default async function EmailOutreachSettingsPage() {
  const runtime = getBrevoRuntimeStatus();
  const account = await checkBrevoAccount();
  const live = runtime.configured && account === "ok";

  return (
    <EmailPageShell
      title="Settings"
      description="Brevo connection, sender identity, and a one-off test send."
    >
      <section className="overflow-hidden rounded-2xl border border-cyan-500/25 bg-surface-elevated">
        <div className="h-1.5 bg-gradient-to-r from-[#2f7f92] via-[#a8894f] to-[#1a2f59]" />
        <div className="flex items-start gap-3 bg-gradient-to-br from-cyan-500/[0.10] via-surface-elevated to-gold/8 p-5">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              live
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-500/15 text-amber-800 dark:text-amber-200"
            }`}
          >
            {live ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            ) : (
              <CircleAlert className="h-4 w-4" aria-hidden />
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {live
                ? "Brevo SMTP is connected"
                : runtime.configured
                  ? "Brevo still needs a working login"
                  : "Brevo is not configured yet"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {live
                ? `Sends will go out as ${runtime.sender.name} <${runtime.sender.email}>.`
                : runtime.configured
                  ? "The SMTP or API key is stored, but the account check failed. Confirm the login in Brevo, then retry a test send."
                  : "Add BREVO_SMTP_KEY or BREVO_API_KEY to send live. Until then, campaign sends run in simulate mode."}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <EmailSection title="Brevo connection" accent="cyan">
          <dl className="space-y-3 text-sm">
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
              <dt className="mb-1 flex items-center gap-1.5 text-muted">
                <Mail className="h-3.5 w-3.5" aria-hidden />
                Webhook
              </dt>
              <dd className="break-all rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs text-foreground">
                {runtime.webhookUrl ?? "Set NEXT_PUBLIC_APP_URL"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">
            Set BREVO_SMTP_KEY or BREVO_API_KEY, plus sender and webhook secret.
            SMTP keys (xsmtpsib-…) send via smtp-relay.brevo.com.
          </p>
        </EmailSection>

        <EmailSection title="Test send" accent="navy">
          <TestSendForm />
        </EmailSection>
      </div>
    </EmailPageShell>
  );
}

export const metadata = { title: "Email OS · Settings" };
