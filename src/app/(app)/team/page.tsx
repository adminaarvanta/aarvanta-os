import { Users } from "lucide-react";
import { TeamClient } from "@/components/team/team-client";
import { buildDemoTeamChannels } from "@/lib/data/team-demo-seed";
import { getTeamRepository } from "@/lib/data/team-store";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";

export default async function TeamPage() {
  const ctx = await getSessionContext();
  const teamRepo = getTeamRepository();
  const tenantRepo = getTenantRepository();

  const [notes, comments, activity, members] = await Promise.all([
    teamRepo.listNotes(ctx.scope),
    teamRepo.listComments(ctx.scope),
    teamRepo.listActivity(ctx.scope),
    tenantRepo.listMembers(ctx.scope),
  ]);

  const channels = buildDemoTeamChannels();

  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#F5E6C8] sm:text-xl">
          <Users className="h-5 w-5 text-[#D4AF37]" />
          Team
        </h2>
        <p className="text-xs text-[#A89878] sm:text-sm">
          Directory, internal channels, notes, comments, @mentions, and activity feed.
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <TeamClient
          members={members}
          notes={notes}
          comments={comments}
          activity={activity}
          channels={channels}
          currentUserId={ctx.userId}
        />
      </div>
    </>
  );
}

export const metadata = { title: "Team" };
