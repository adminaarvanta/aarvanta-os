import { CampaignWizard } from "@/components/voice/campaign-wizard";

export default function NewCampaignPage() {
  return (
    <>
      <header className="border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-foreground">
          Campaign builder
        </h2>
        <p className="text-xs text-muted sm:text-sm">
          Campaign → Leads → Voice Agent → Working Hours → Retry Rules → Launch
        </p>
      </header>
      <CampaignWizard />
    </>
  );
}

export const metadata = { title: "Voice OS · New Campaign" };
