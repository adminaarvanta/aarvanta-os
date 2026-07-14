import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavigationProvider } from "@/components/layout/navigation-provider";
import { ScrollRestoration } from "@/components/layout/scroll-restoration";
import { DemoTourOverlay } from "@/components/demo/demo-tour-overlay";
import { DemoTourProvider } from "@/components/demo/demo-tour-provider";
import { SupportAssistant } from "@/components/support/support-assistant";
import type { Organization, Workspace } from "@/types/tenant";

export function AppShell({
  production,
  tenant,
  userName,
  userRole,
  inboxUnread,
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
  inboxUnread?: number;
  children: React.ReactNode;
}) {
  return (
    <NavigationProvider>
      <DemoTourProvider>
        <ScrollRestoration />
        <div className="flex h-[100dvh] overflow-hidden bg-background">
          <AppSidebar
            production={production}
            tenant={tenant}
            userName={userName}
            userRole={userRole}
            inboxUnread={inboxUnread}
          />
          <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:pb-0">
            <AppHeader />
            {children}
          </main>
          <MobileNav production={production} />
        </div>
        <SupportAssistant />
        <DemoTourOverlay />
      </DemoTourProvider>
    </NavigationProvider>
  );
}
