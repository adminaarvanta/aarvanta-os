import { Suspense } from "react";
import { Rocket } from "lucide-react";
import { LaunchClient } from "@/components/launch/launch-client";
import { ModulePageShell } from "@/components/platform/module-page-shell";

export default function LaunchPage() {
  return (
    <ModulePageShell
      icon={Rocket}
      title="Launch OS"
      description="Idea → industry-aware business OS in minutes (AGEB Volume 11)"
    >
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <LaunchClient />
      </Suspense>
    </ModulePageShell>
  );
}

export const metadata = { title: "Launch OS" };
