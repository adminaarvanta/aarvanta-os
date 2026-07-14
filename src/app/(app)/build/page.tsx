import { Suspense } from "react";
import { Hammer } from "lucide-react";
import { BuildOsClient } from "@/components/build/build-os-client";
import { ModulePageShell } from "@/components/platform/module-page-shell";

export default function BuildPage() {
  return (
    <ModulePageShell
      icon={Hammer}
      title="Build OS"
      description="Describe your business, customize the look, preview live, then generate your site plan"
    >
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <BuildOsClient />
      </Suspense>
    </ModulePageShell>
  );
}

export const metadata = { title: "Build OS" };
