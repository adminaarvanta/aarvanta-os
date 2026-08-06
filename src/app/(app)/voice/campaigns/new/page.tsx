import { CampaignWizard } from "@/components/voice/campaign-wizard";
import { VoicePageShell } from "@/components/voice/voice-ui";

export default function NewCampaignPage() {
  return (
    <VoicePageShell
      title="Campaign builder"
      subtitle="Campaign → Leads → Voice Agent → Working Hours → Retry Rules → Launch"
      tone="gold"
    >
      <CampaignWizard />
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · New Campaign" };
