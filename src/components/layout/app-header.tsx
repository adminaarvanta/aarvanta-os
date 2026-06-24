"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const GlobalSearch = dynamic(
  () =>
    import("@/components/layout/global-search").then((mod) => mod.GlobalSearch),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-full animate-pulse rounded-lg bg-[#141414]" />
    ),
  }
);

const HelpMenu = dynamic(
  () => import("@/components/layout/help-menu").then((mod) => mod.HelpMenu),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-20 shrink-0 animate-pulse rounded-full bg-[#141414]" />
    ),
  }
);

export function AppHeader() {
  return (
    <header className="shrink-0 border-b border-[#3d3528] bg-[#0a0a0a] px-3 py-2 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <GlobalSearch className="min-w-0 flex-1" />
        <Suspense fallback={null}>
          <HelpMenu />
        </Suspense>
      </div>
    </header>
  );
}
