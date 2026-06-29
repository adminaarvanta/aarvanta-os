"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const GlobalSearch = dynamic(
  () =>
    import("@/components/layout/global-search").then((mod) => mod.GlobalSearch),
  {
    ssr: false,
    loading: () => (
      <div className="h-9 w-48 shrink-0 animate-pulse rounded-lg bg-surface-muted sm:w-56" />
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
    <header className="relative z-10 flex h-14 shrink-0 items-center bg-surface/95 px-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-4">
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <GlobalSearch className="w-48 shrink-0 sm:w-56" />
        <Suspense fallback={null}>
          <HelpMenu />
        </Suspense>
      </div>
    </header>
  );
}
