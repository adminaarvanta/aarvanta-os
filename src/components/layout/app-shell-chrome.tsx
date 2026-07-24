"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";

/** Hides the global header on immersive surfaces like Build OS. */
export function AppShellChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeader = pathname === "/build" || pathname.startsWith("/build/");

  return (
    <>
      {!hideHeader ? <AppHeader /> : null}
      {children}
    </>
  );
}
