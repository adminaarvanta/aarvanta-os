import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavigationProvider } from "@/components/layout/navigation-provider";
import { ScrollRestoration } from "@/components/layout/scroll-restoration";
import { SidebarCollapseProvider } from "@/components/layout/sidebar-collapse";
import { DemoTourOverlay } from "@/components/demo/demo-tour-overlay";
import { DemoTourProvider } from "@/components/demo/demo-tour-provider";
import { SupportAssistant } from "@/components/support/support-assistant";
import type { Organization, Workspace } from "@/types/tenant";
import { AppShellChrome } from "@/components/layout/app-shell-chrome";

export function AppShell({
  production,
  tenant,
  userName,
  userRole,
  whatsappUnread,
  voiceUnread,
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
  children: React.ReactNode;
}) {
  return (
    <NavigationProvider>
      <SidebarCollapseProvider>
        <DemoTourProvider>
          <ScrollRestoration />
          <div className="flex h-[100dvh] overflow-hidden bg-background">
            <AppSidebar
              production={production}
              tenant={tenant}
              userName={userName}
              userRole={userRole}
              whatsappUnread={whatsappUnread}
              voiceUnread={voiceUnread}
            />
            <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:pb-0">
              <AppShellChrome>{children}</AppShellChrome>
            </main>
            <MobileNav production={production} />
          </div>
          <SupportAssistant />
          <DemoTourOverlay />
        </DemoTourProvider>
      </SidebarCollapseProvider>
    </NavigationProvider>
  );
}
