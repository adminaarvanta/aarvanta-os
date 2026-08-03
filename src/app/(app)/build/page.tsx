import { Suspense } from "react";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { BuildOsClient } from "@/components/build/build-os-client";
import { PageFrame } from "@/components/layout/page-scroll";

export default function BuildPage() {
  return (
    <PageFrame className="bg-background">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-end border-b border-border bg-surface-elevated px-4 py-2">
          <AskAiButton module="build" />
        </div>
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
              Loading Build OS…
            </div>
          }
        >
          <BuildOsClient />
        </Suspense>
      </div>
    </PageFrame>
  );
}

export const metadata = { title: "Build OS" };
