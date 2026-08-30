"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DemoTourOverlay } from "@/components/demo/demo-tour-overlay";
import { SupportAssistant } from "@/components/support/support-assistant";
import type { Organization, Workspace } from "@/types/tenant";

/** Chrome around app pages — site preview is full-bleed (no OS header/sidebar). */
export function AppShellFrame({
  production,
  tenant,
  userName,
  userRole,
  whatsappUnread,
  voiceUnread,
  showWhatsAppNav,
  showOutreachNav,
  children,
}: {
  production: boolean;
  tenant?: {
    organization: Organization;
    workspace: Workspace;
    workspaces: Workspace[];
  } | null;
  userName?: string;
  userRole?: string;
  whatsappUnread?: number;
  voiceUnread?: number;
  showWhatsAppNav?: boolean;
  showOutreachNav?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const sitePreview = pathname.startsWith("/build/preview/");
  const hideHeader =
    sitePreview || pathname === "/build" || pathname.startsWith("/build/");

  if (sitePreview) {
    return (
      <div className="h-[100dvh] min-h-0 overflow-y-auto overflow-x-hidden bg-background">
        {children}
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[100dvh] overflow-hidden bg-background">
        <AppSidebar
          production={production}
          tenant={tenant}
          userName={userName}
          userRole={userRole}
          whatsappUnread={whatsappUnread}
          voiceUnread={voiceUnread}
          showWhatsAppNav={showWhatsAppNav}
          showOutreachNav={showOutreachNav}
        />
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          {!hideHeader ? <AppHeader /> : null}
          {children}
        </main>
        <MobileNav
          production={production}
          showWhatsAppNav={showWhatsAppNav}
          showOutreachNav={showOutreachNav}
        />
      </div>
      <SupportAssistant />
      <DemoTourOverlay />
    </>
  );
}
