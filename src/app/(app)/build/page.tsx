import { Suspense } from "react";
import { Hammer } from "lucide-react";
import { BuildOsClient } from "@/components/build/build-os-client";
import { ModulePageShell } from "@/components/platform/module-page-shell";

export default function BuildPage() {
  return (
    <ModulePageShell
      icon={Hammer}
      title="Build OS"
      description="Preferences → AI site plan → approve before generation (SiteOS)"
    >
      <Suspense fallback={<p className="text-sm text-[#9AABC4]">Loading…</p>}>
        <BuildOsClient />
      </Suspense>
    </ModulePageShell>
  );
}

export const metadata = { title: "Build OS" };
