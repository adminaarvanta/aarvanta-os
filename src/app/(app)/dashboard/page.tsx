import { CommandCenterDashboard } from "@/components/command-center/command-center-dashboard";
import { buildFounderSnapshot } from "@/lib/founder/build-snapshot";
import { getSessionContext } from "@/lib/tenant/context";

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  const snapshot = await buildFounderSnapshot(ctx.scope);

  return (
    <CommandCenterDashboard userName={ctx.name || ctx.email} snapshot={snapshot} />
  );
}

export const metadata = { title: "Command Center" };
