import { Video } from "lucide-react";
import { MeetingsClient } from "@/components/platform/meetings-client";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getMeetingsStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function MeetingsPage() {
  const scope = await getTenantScope();
  const meetings = await getMeetingsStore().list(scope);

  return (
    <ModulePageShell
      icon={Video}
      title="Meetings"
      description="Upload transcripts and track summaries, action items, and follow-ups."
    >
      <div className="space-y-8">
        <MeetingsClient />

        <StatGrid
          items={[
            { label: "Records", value: meetings.length, sub: "Stored meetings" },
            {
              label: "Action items",
              value: meetings.reduce((count, meeting) => count + meeting.actionItems.length, 0),
              sub: "Extracted follow-ups",
            },
            {
              label: "Zoom",
              value: meetings.filter((meeting) => meeting.source === "zoom").length,
              sub: "Source distribution",
            },
            {
              label: "Teams",
              value: meetings.filter((meeting) => meeting.source === "teams").length,
              sub: "Source distribution",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Meeting records</h3>
          <CardList
            items={meetings.map((meeting) => ({
              id: meeting.id,
              title: meeting.title,
              body: meeting.summary || meeting.transcript,
              meta: `${meeting.actionItems.length} action items · ${new Date(
                meeting.createdAt
              ).toLocaleDateString()}`,
              badge: meeting.source,
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Meetings" };
