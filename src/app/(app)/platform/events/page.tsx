import { Activity } from "lucide-react";
import { EventAuditPanel } from "@/components/platform/event-audit-panel";
import { ModulePageShell } from "@/components/platform/module-page-shell";
import { requirePermission } from "@/lib/tenant/context";
import { redirect } from "next/navigation";

export default async function PlatformEventsPage() {
  try {
    await requirePermission("platform:audit");
  } catch {
    redirect("/dashboard");
  }

  return (
    <ModulePageShell
      icon={Activity}
      title="Event audit log"
      description="Phase 1 foundation — domain events from CRM and platform mutations"
    >
      <EventAuditPanel />
    </ModulePageShell>
  );
}

export const metadata = { title: "Event audit log" };
